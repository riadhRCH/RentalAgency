import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VisitRequest, VisitRequestDocument } from '../schemas/visit-request.schema';
import { Property, PropertyDocument } from '../schemas/property.schema';
import { Announcement, AnnouncementDocument } from '../schemas/announcement.schema';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationType } from '../schemas/notification.schema';

@Injectable()
export class VisitRequestsService {
  constructor(
    @InjectModel(VisitRequest.name)
    private readonly visitModel: Model<VisitRequestDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async createPublic(dto: any) {
    const announcement = await this.announcementModel.findById(
      new Types.ObjectId(dto.announcementId),
    );
    if (!announcement) throw new NotFoundException('Announcement not found');

    const property = await this.propertyModel.findById(announcement.propertyId);
    if (!property) throw new NotFoundException('Property not found');

    const visit = await this.visitModel.create({
      propertyId: announcement.propertyId,
      agencyId: property.agencyId,
      customerPhone: dto.customerPhone,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      notes: dto.notes,
    });

    await this.notifyAgencyOwner(property.agencyId.toString(), 'created', dto.customerName, dto.customerPhone);

    return visit;
  }

  async findOnePublic(id: string) {
    const visit = await this.visitModel.findById(new Types.ObjectId(id))
      .populate('propertyId')
      .populate('visitorId');
    if (!visit) throw new NotFoundException('Visit request not found');
    return visit;
  }

  async updatePublic(id: string, dto: any) {
    const existing = await this.visitModel.findById(new Types.ObjectId(id));
    if (!existing) throw new NotFoundException('Visit request not found');

    const allowedFields = ['customerName', 'customerPhone', 'customerEmail', 'notes', 'visitDate', 'visitTime'];
    const update: any = {};
    for (const field of allowedFields) {
      if (dto[field] !== undefined) update[field] = dto[field];
    }

    const visit = await this.visitModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: update },
      { new: true },
    );
    if (!visit) throw new NotFoundException('Visit request not found');

    const dateChanged = dto.visitDate !== undefined && dto.visitDate !== existing.visitDate?.toISOString();
    const timeChanged = dto.visitTime !== undefined && dto.visitTime !== existing.visitTime;
    if (dateChanged || timeChanged) {
      const property = await this.propertyModel.findById(existing.propertyId);
      if (property) {
        await this.notifyAgencyOwner(property.agencyId.toString(), 'date-changed', visit.customerName, visit.customerPhone);
      }
    }

    return visit;
  }

  async findAll(agencyId: string, page = 1, limit = 20, status?: string) {
    const query: any = { agencyId: new Types.ObjectId(agencyId) };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [visits, total] = await Promise.all([
      this.visitModel
        .find(query)
        .sort({ visitDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('propertyId')
        .populate('visitorId'),
      this.visitModel.countDocuments(query),
    ]);

    return {
      data: visits,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(agencyId: string, id: string) {
    const visit = await this.visitModel.findOne({
      _id: new Types.ObjectId(id),
      agencyId: new Types.ObjectId(agencyId),
    }).populate('propertyId').populate('visitorId');
    if (!visit) throw new NotFoundException('Visit request not found');
    return visit;
  }

  async update(agencyId: string, id: string, dto: any) {
    const visit = await this.visitModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), agencyId: new Types.ObjectId(agencyId) },
      { $set: dto },
      { new: true },
    );
    if (!visit) throw new NotFoundException('Visit request not found');
    return visit;
  }

  async remove(agencyId: string, id: string) {
    const result = await this.visitModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      agencyId: new Types.ObjectId(agencyId),
    });
    if (!result) throw new NotFoundException('Visit request not found');
    return { message: 'Visit request deleted successfully' };
  }

  private async notifyAgencyOwner(agencyId: string, event: 'created' | 'date-changed', customerName?: string, customerPhone?: string) {
    try {
      const agency = await this.agencyModel.findById(new Types.ObjectId(agencyId));
      if (!agency || !agency.ownerId) return;

      const name = customerName || customerPhone || 'Unknown';
      const link = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/overview/visits`;

      if (event === 'created') {
        await this.notificationService.sendNotification(
          agency.ownerId.toString(),
          NotificationType.VISIT_REQUEST_CREATED,
          'Nouvelle Demande de Visite',
          `Une nouvelle demande de visite a ete creee par ${name}.`,
          link,
          { agencyId, customerPhone },
        );
      } else if (event === 'date-changed') {
        await this.notificationService.sendNotification(
          agency.ownerId.toString(),
          NotificationType.VISIT_REQUEST_UPDATED,
          'Visite Mise a Jour',
          `${name} a modifie la date ou l'heure de sa visite.`,
          link,
          { agencyId, customerPhone },
        );
      }
    } catch (error) {
      // Notification failure should not block the operation
    }
  }
}
