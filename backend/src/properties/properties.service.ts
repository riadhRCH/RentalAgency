import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from '../schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<PersonnelDocument>,
  ) {}

  async findAll(
    agencyId: string,
    page = 1,
    limit = 20,
    filters?: {
      type?: string;
      status?: string;
      minPrice?: number;
      maxPrice?: number;
      minSurface?: number;
      maxSurface?: number;
    },
  ) {
    const query: any = {
      agencyId: new Types.ObjectId(agencyId),
      deletedAt: { $exists: false },
    };

    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.minPrice || filters?.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }
    if (filters?.minSurface || filters?.maxSurface) {
      query.surface = {};
      if (filters.minSurface) query.surface.$gte = filters.minSurface;
      if (filters.maxSurface) query.surface.$lte = filters.maxSurface;
    }

    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      this.propertyModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId'),
      this.propertyModel.countDocuments(query),
    ]);

    return {
      data: properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(agencyId: string, id: string) {
    const property = await this.propertyModel
      .findOne({
        _id: new Types.ObjectId(id),
        agencyId: new Types.ObjectId(agencyId),
        deletedAt: { $exists: false },
      })
      .populate('ownerId');
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async getPublicProperty(id: string) {
    const property = await this.propertyModel
      .findOne({
        _id: new Types.ObjectId(id),
        status: { $ne: 'sold' },
        deletedAt: { $exists: false },
      })
      .populate('ownerId')
      .select(
        'reference type address gpsLocation surface price paymentFrequency googleMapsLink description photos videos previewVideo amenities calendarData ownerId createdAt',
      );
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async create(agencyId: string, dto: CreatePropertyDto) {
    let ownerId = dto.ownerId;

    if (!ownerId && dto.ownerPhone) {
      let personnel = await this.personnelModel.findOne({
        phone: dto.ownerPhone,
      });

      if (!personnel) {
        personnel = await this.personnelModel.create({
          phone: dto.ownerPhone,
          source: 'manual',
          status: 'active',
        });
      }
      ownerId = personnel._id.toString();
    }

    const reference = `PROP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const property = await this.propertyModel.create({
      ...dto,
      agencyId: new Types.ObjectId(agencyId),
      ownerId: new Types.ObjectId(ownerId),
      reference,
    });
    return property;
  }

  async update(agencyId: string, id: string, dto: UpdatePropertyDto) {
    const updateData: any = { ...dto };
    if (dto.ownerId) updateData.ownerId = new Types.ObjectId(dto.ownerId);

    const property = await this.propertyModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        agencyId: new Types.ObjectId(agencyId),
        deletedAt: { $exists: false },
      },
      { $set: updateData },
      { new: true },
    );
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async remove(agencyId: string, id: string) {
    const property = await this.propertyModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        agencyId: new Types.ObjectId(agencyId),
        deletedAt: { $exists: false },
      },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!property) throw new NotFoundException('Property not found');
    return { message: 'Property soft-deleted successfully' };
  }
}
