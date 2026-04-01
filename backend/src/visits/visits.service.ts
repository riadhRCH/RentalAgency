import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VisitRequest, VisitRequestDocument } from '../schemas/visit-request.schema';

@Injectable()
export class VisitRequestsService {
  constructor(
    @InjectModel(VisitRequest.name)
    private readonly visitModel: Model<VisitRequestDocument>,
  ) {}

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
}
