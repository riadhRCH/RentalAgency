import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { Property, PropertyDocument } from '../schemas/property.schema';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';

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
}
