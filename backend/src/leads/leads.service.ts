import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
  ) {}

  async findAll(
    agencyId: string,
    page = 1,
    limit = 20,
    status?: string,
  ) {
    const query: any = { agencyId: new Types.ObjectId(agencyId) };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [leads, total] = await Promise.all([
      this.leadModel
        .find(query)
        .sort({ lastInteraction: -1 })
        .skip(skip)
        .limit(limit),
      this.leadModel.countDocuments(query),
    ]);

    return {
      data: leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(agencyId: string, leadId: string) {
    const lead = await this.leadModel.findOne({
      _id: new Types.ObjectId(leadId),
      agencyId: new Types.ObjectId(agencyId),
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async create(agencyId: string, dto: CreateLeadDto) {
    const lead = await this.leadModel.create({
      agencyId: new Types.ObjectId(agencyId),
      customerPhone: dto.customerPhone,
      customerName: dto.customerName,
      tags: dto.tags || [],
      notes: dto.notes,
      activities: [{ type: 'MANUAL' }],
    });
    return lead;
  }

  async update(agencyId: string, leadId: string, dto: UpdateLeadDto) {
    const lead = await this.leadModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(leadId),
        agencyId: new Types.ObjectId(agencyId),
      },
      { $set: dto },
      { new: true },
    );
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async remove(agencyId: string, leadId: string) {
    const result = await this.leadModel.findOneAndDelete({
      _id: new Types.ObjectId(leadId),
      agencyId: new Types.ObjectId(agencyId),
    });
    if (!result) throw new NotFoundException('Lead not found');
    return { message: 'Lead deleted successfully' };
  }
}
