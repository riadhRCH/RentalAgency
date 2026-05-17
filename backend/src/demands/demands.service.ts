import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Demand, DemandDocument } from '../schemas/demand.schema';
import { CreateDemandDto } from './dto/create-demand.dto';
import { UpdateDemandDto } from './dto/update-demand.dto';

@Injectable()
export class DemandsService {
  constructor(
    @InjectModel(Demand.name)
    private readonly demandModel: Model<DemandDocument>,
  ) {}

  async createPublic(agencyId?: string) {
    const resolvedAgencyId = agencyId || process.env.DEFAULT_AGENCY_ID;
    const data: any = { status: 'NEW' };
    if (resolvedAgencyId) {
      data.agencyId = new Types.ObjectId(resolvedAgencyId);
    }
    const demand = await this.demandModel.create(data);
    return demand;
  }

  async findOnePublic(id: string) {
    const demand = await this.demandModel.findById(new Types.ObjectId(id));
    if (!demand) throw new NotFoundException('Demand not found');
    return demand;
  }

  async updatePublic(id: string, dto: any) {
    const allowedFields = [
      'customerName', 'customerEmail',
      'nbBedrooms', 'mustHaveFeatures',
      'additionalNotes', 'budget',
    ];
    const update: any = {};
    for (const field of allowedFields) {
      if (dto[field] !== undefined) update[field] = dto[field];
    }
    const demand = await this.demandModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: update },
      { new: true },
    );
    if (!demand) throw new NotFoundException('Demand not found');
    return demand;
  }

  async create(agencyId: string, personnelId: string, dto: CreateDemandDto) {
    const demand = await this.demandModel.create({
      agencyId: new Types.ObjectId(agencyId),
      personnelId: new Types.ObjectId(personnelId),
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      nbBedrooms: dto.nbBedrooms,
      mustHaveFeatures: dto.mustHaveFeatures || [],
      additionalNotes: dto.additionalNotes,
      budget: dto.budget,
    });
    return demand;
  }

  async findAll(agencyId: string, page = 1, limit = 20) {
    const query = { agencyId: new Types.ObjectId(agencyId) };
    const skip = (page - 1) * limit;
    const [demands, total] = await Promise.all([
      this.demandModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('personnelId'),
      this.demandModel.countDocuments(query),
    ]);
    return {
      data: demands,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(agencyId: string, id: string) {
    const demand = await this.demandModel.findOne({
      _id: new Types.ObjectId(id),
      agencyId: new Types.ObjectId(agencyId),
    }).populate('personnelId');
    if (!demand) throw new NotFoundException('Demand not found');
    return demand;
  }

  async update(agencyId: string, id: string, dto: UpdateDemandDto) {
    const demand = await this.demandModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), agencyId: new Types.ObjectId(agencyId) },
      { $set: dto },
      { new: true },
    );
    if (!demand) throw new NotFoundException('Demand not found');
    return demand;
  }

  async remove(agencyId: string, id: string) {
    const result = await this.demandModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      agencyId: new Types.ObjectId(agencyId),
    });
    if (!result) throw new NotFoundException('Demand not found');
    return { message: 'Demand deleted successfully' };
  }
}
