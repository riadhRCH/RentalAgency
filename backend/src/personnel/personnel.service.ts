import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { Property, PropertyDocument } from '../schemas/property.schema';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { Cashout, CashoutDocument, CashoutStatus } from '../schemas/cashout.schema';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationType } from '../schemas/notification.schema';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<PersonnelDocument>,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Cashout.name)
    private readonly cashoutModel: Model<CashoutDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(page = 1, limit = 20, source?: string, status?: string) {
    const query: any = { deletedAt: { $exists: false } };
    if (source) query.source = source;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [personnel, total] = await Promise.all([
      this.personnelModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.personnelModel.countDocuments(query),
    ]);

    return {
      data: personnel,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const person = await this.personnelModel.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: { $exists: false },
    });
    if (!person) throw new NotFoundException('Personnel not found');
    return person;
  }

  async create(dto: CreatePersonnelDto) {
    const person = await this.personnelModel.create(dto);
    return person;
  }

  async createPublic(dto: CreatePersonnelDto) {
    // Find existing personnel by phone, if exists update it, otherwise create
    const existingPerson = await this.personnelModel.findOne({
      phone: dto.phone,
      deletedAt: { $exists: false }
    });

    if (existingPerson) {
      // Update existing person with new data
      const updated = await this.personnelModel.findOneAndUpdate(
        { phone: dto.phone, deletedAt: { $exists: false } },
        { 
          $set: {
            ...dto,
            source: 'public'
          }
        },
        { new: true }
      );
      return updated;
    }

    // Create new person if doesn't exist
    const person = await this.personnelModel.create({
      ...dto,
      source: 'public'
    });
    return person;
  }

  async update(id: string, dto: UpdatePersonnelDto) {
    const person = await this.personnelModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: { $exists: false } },
      { $set: dto },
      { new: true },
    );
    if (!person) throw new NotFoundException('Personnel not found');
    return person;
  }

  async remove(id: string) {
    const person = await this.personnelModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: { $exists: false } },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!person) throw new NotFoundException('Personnel not found');
    return { message: 'Personnel soft-deleted successfully' };
  }

  async identify(phone: string, source: string = 'manual') {
    let person = await this.personnelModel.findOne({ phone });
    if (!person) {
      person = await this.personnelModel.create({
        phone,
        source,
      });
    }
    return person;
  }

  async getContext(id: string) {
    const personId = new Types.ObjectId(id);

    const [staffAt, propertiesOwned, leads] = await Promise.all([
      this.agencyModel.find({ 'staff.personnelId': personId }, { name: 1, 'staff.$': 1 }),
      this.propertyModel.find({ ownerId: personId, deletedAt: { $exists: false } }, { reference: 1, address: 1, type: 1 }),
      this.leadModel.find({ personnelId: personId }, { agencyId: 1, status: 1, createdAt: 1 }),
    ]);

    return {
      staffAt: staffAt.map((a) => ({
        agencyId: a._id,
        agencyName: a.name,
        role: a.staff[0].role,
      })),
      propertiesOwned: propertiesOwned.map((p) => ({
        propertyId: p._id,
        reference: p.reference,
        address: p.address,
        type: p.type,
      })),
      linkedLeads: leads.map((l) => ({
        leadId: l._id,
        agencyId: l.agencyId,
        status: l.status,
        createdAt: l.createdAt,
      })),
    };
  }

  async generateDashboardToken(id: string) {
    // Generate a secure token
    const token = Buffer.from(`${id}-${Date.now()}-${Math.random()}`).toString('base64');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const person = await this.personnelModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: { $exists: false } },
      { $set: { dashboardToken: token, dashboardTokenExpiresAt: expiresAt } },
      { new: true },
    );
    if (!person) throw new NotFoundException('Personnel not found');
    return { token, expiresAt };
  }

  async getOwnerDashboardData(token: string) {
    const person = await this.personnelModel.findOne({
      dashboardToken: token,
      dashboardTokenExpiresAt: { $gt: new Date() },
      deletedAt: { $exists: false }
    });

    if (!person) throw new NotFoundException('Invalid or expired dashboard token');

    const personId = new Types.ObjectId(person._id);
    const properties = await this.propertyModel.find(
      { ownerId: personId, deletedAt: { $exists: false } },
      { reference: 1, address: 1, type: 1, price: 1, photos: 1, amenities: 1, calendarData: 1, views: 1, agencyId: 1 }
    ).populate('agencyId', 'name');

    const agencyId = properties.length > 0 ? properties[0].agencyId['_id'] || properties[0].agencyId : null;

    // Fetch closed transactions for these properties
    const propertyIds = properties.map(p => p._id);
    const closedTransactions = await this.transactionModel.find({
      propertyId: { $in: propertyIds },
      status: 'CLOSED',
      deletedAt: { $exists: false }
    }).populate('propertyId', 'reference address');

    // Fetch cashouts
    const cashouts = await this.cashoutModel.find({
      ownerId: personId,
    }).sort({ createdAt: -1 });

    // Calculate balance
    const totalEarnings = closedTransactions.reduce((sum, t) => sum + (t.financialDetails?.rentAmount || 0), 0);
    const totalCashouts = cashouts
      .filter(c => c.status === CashoutStatus.CONFIRMED)
      .reduce((sum, c) => sum + c.amount, 0);
    
    const balance = totalEarnings - totalCashouts;

    return {
      owner: {
        _id: person._id,
        firstName: person.firstName,
        lastName: person.lastName,
        phone: person.phone,
        email: person.email,
      },
      properties,
      agencyId,
      transactions: closedTransactions,
      cashouts,
      balance,
    };
  }

  async updatePropertyAvailability(token: string, propertyId: string, calendarData: any) {
    const person = await this.personnelModel.findOne({
      dashboardToken: token,
      dashboardTokenExpiresAt: { $gt: new Date() },
      deletedAt: { $exists: false }
    });

    if (!person) throw new NotFoundException('Invalid or expired dashboard token');

    const property = await this.propertyModel.findOneAndUpdate(
      { _id: new Types.ObjectId(propertyId), ownerId: person._id, deletedAt: { $exists: false } },
      { $set: { calendarData } },
      { new: true },
    );

    if (!property) throw new NotFoundException('Property not found or access denied');

    // Notify agency staff about availability change
    const agency = await this.agencyModel.findById(property.agencyId);
    if (agency && agency.staff && agency.staff.length > 0) {
      const propertyLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/properties/edit/${propertyId}`;
      for (const staffMember of agency.staff) {
        await this.notificationService.sendNotification(
          staffMember.personnelId.toString(),
          NotificationType.PROPERTY_AVAILABILITY_CHANGED,
          'Disponibilite Modifiee',
          `Le proprietaire a modifie la disponibilite du bien ${property.reference}.`,
          propertyLink,
          { propertyId, ownerId: person._id },
        );
      }
    }

    return property;
  }

  async updatePropertyPrice(token: string, propertyId: string, price: number) {
    const person = await this.personnelModel.findOne({
      dashboardToken: token,
      dashboardTokenExpiresAt: { $gt: new Date() },
      deletedAt: { $exists: false }
    });

    if (!person) throw new NotFoundException('Invalid or expired dashboard token');

    const property = await this.propertyModel.findOneAndUpdate(
      { _id: new Types.ObjectId(propertyId), ownerId: person._id, deletedAt: { $exists: false } },
      { $set: { price } },
      { new: true },
    );

    if (!property) throw new NotFoundException('Property not found or access denied');

    // Notify agency staff about price change
    const agency = await this.agencyModel.findById(property.agencyId);
    if (agency && agency.staff && agency.staff.length > 0) {
      const propertyLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/properties/edit/${propertyId}`;
      for (const staffMember of agency.staff) {
        await this.notificationService.sendNotification(
          staffMember.personnelId.toString(),
          NotificationType.PROPERTY_PRICE_CHANGED,
          'Prix Modifie',
          `Le proprietaire a modifie le prix du bien ${property.reference} a ${price} TND.`,
          propertyLink,
          { propertyId, ownerId: person._id, newPrice: price },
        );
      }
    }

    return property;
  }

  async findOwnersByAgency(agencyId: string, page = 1, limit = 20) {
    const agencyObjectId = new Types.ObjectId(agencyId);

    // Aggregate properties to get unique ownerIds and their property counts
    const ownerAggregation = await this.propertyModel.aggregate([
      {
        $match: {
          agencyId: agencyObjectId,
          deletedAt: { $exists: false },
        },
      },
      {
        $group: {
          _id: '$ownerId',
          propertiesCount: { $sum: 1 },
        },
      },
    ]);

    if (ownerAggregation.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Build a map of ownerId -> propertiesCount
    const ownerCountMap = new Map<string, number>();
    const ownerIds: Types.ObjectId[] = [];
    for (const entry of ownerAggregation) {
      ownerIds.push(entry._id);
      ownerCountMap.set(entry._id.toString(), entry.propertiesCount);
    }

    const total = ownerIds.length;
    const totalPages = Math.ceil(total / limit);

    // Paginate the ownerIds
    const skip = (page - 1) * limit;
    const paginatedOwnerIds = ownerIds.slice(skip, skip + limit);

    // Fetch the personnel records for the paginated ownerIds
    const owners = await this.personnelModel.find({
      _id: { $in: paginatedOwnerIds },
      deletedAt: { $exists: false },
    });

    // Attach propertiesCount to each owner
    const data = owners.map((owner) => {
      const ownerObj = owner.toObject();
      return {
        ...ownerObj,
        propertiesCount: ownerCountMap.get(owner._id.toString()) || 0,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
