import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementDocument } from '../schemas/announcement.schema';
import { Property, PropertyDocument } from '../schemas/property.schema';

type PublicAnnouncementFilters = {
  query?: string;
  type?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
};

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  private buildTitle(property: PropertyDocument | Property) {
    return `${property.type} ${property.reference}`.trim();
  }

  private buildSearchIndex(property: PropertyDocument | Property) {
    const query = [
      property.reference,
      property.type,
      property.address,
      property.description,
      Object.values(property.amenities ?? {}).join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return {
      query,
      location: property.address.toLowerCase(),
    };
  }

  private async loadAgencyProperty(agencyId: string, propertyId: string) {
    const property = await this.propertyModel.findOne({
      _id: new Types.ObjectId(propertyId),
      agencyId: new Types.ObjectId(agencyId),
      deletedAt: { $exists: false },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  private buildAnnouncementPayload(agencyId: string, property: PropertyDocument) {
    return {
      agencyId: new Types.ObjectId(agencyId),
      propertyId: property._id,
      reference: property.reference,
      type: property.type,
      title: this.buildTitle(property),
      address: property.address,
      surface: property.surface,
      price: property.price,
      paymentFrequency: property.paymentFrequency,
      description: property.description,
      photos: property.photos ?? [],
      previewVideo: property.previewVideo,
      propertyStatus: property.status,
      amenities: property.amenities ?? {},
      searchIndex: this.buildSearchIndex(property),
    };
  }

  async createOrRefreshFromProperty(agencyId: string, propertyId: string) {
    const property = await this.loadAgencyProperty(agencyId, propertyId);

    if (property.status === 'sold') {
      throw new BadRequestException(
        'Announcements cannot be generated for sold properties',
      );
    }

    const payload = this.buildAnnouncementPayload(agencyId, property);
    const now = new Date();

    return this.announcementModel.findOneAndUpdate(
      {
        agencyId: new Types.ObjectId(agencyId),
        propertyId: property._id,
        deletedAt: { $exists: false },
      },
      {
        $set: {
          ...payload,
          isVisible: true,
          refreshedAt: now,
        },
        $unset: {
          hiddenAt: 1,
        },
        $setOnInsert: {
          publishedAt: now,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  async findAllByAgency(agencyId: string) {
    return this.announcementModel
      .find({
        agencyId: new Types.ObjectId(agencyId),
        deletedAt: { $exists: false },
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateVisibility(agencyId: string, id: string, isVisible: boolean) {
    const announcement = await this.announcementModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        agencyId: new Types.ObjectId(agencyId),
        deletedAt: { $exists: false },
      },
      isVisible
        ? {
            $set: { isVisible: true },
            $unset: { hiddenAt: 1 },
          }
        : {
            $set: { isVisible: false, hiddenAt: new Date() },
          },
      { new: true },
    );

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  async refresh(agencyId: string, id: string) {
    const announcement = await this.announcementModel.findOne({
      _id: new Types.ObjectId(id),
      agencyId: new Types.ObjectId(agencyId),
      deletedAt: { $exists: false },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.createOrRefreshFromProperty(agencyId, announcement.propertyId.toString());
  }

  async remove(agencyId: string, id: string) {
    const announcement = await this.announcementModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        agencyId: new Types.ObjectId(agencyId),
        deletedAt: { $exists: false },
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return { message: 'Announcement deleted successfully' };
  }

  async findPublicByAgency(
    agencyId: string,
    page = 1,
    limit = 12,
    filters?: PublicAnnouncementFilters,
  ) {
    const query: Record<string, any> = {
      agencyId: new Types.ObjectId(agencyId),
      isVisible: true,
      deletedAt: { $exists: false },
      propertyStatus: { $ne: 'sold' },
    };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.location) {
      query['searchIndex.location'] = { $regex: filters.location, $options: 'i' };
    }

    if (filters?.query) {
      query['searchIndex.query'] = { $regex: filters.query, $options: 'i' };
    }

    if (filters?.minPrice || filters?.maxPrice) {
      query.price = {};
      if (filters.minPrice) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        query.price.$lte = filters.maxPrice;
      }
    }

    const skip = (page - 1) * limit;
    const [announcements, total] = await Promise.all([
      this.announcementModel
        .find(query)
        .sort({ refreshedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.announcementModel.countDocuments(query),
    ]);

    return {
      data: announcements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllPublic(
    page = 1,
    limit = 12,
    filters?: PublicAnnouncementFilters,
  ) {
    const query: Record<string, any> = {
      isVisible: true,
      deletedAt: { $exists: false },
      propertyStatus: { $ne: 'sold' },
    };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.location) {
      query['searchIndex.location'] = { $regex: filters.location, $options: 'i' };
    }

    if (filters?.query) {
      query['searchIndex.query'] = { $regex: filters.query, $options: 'i' };
    }

    if (filters?.minPrice || filters?.maxPrice) {
      query.price = {};
      if (filters.minPrice) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        query.price.$lte = filters.maxPrice;
      }
    }

    const skip = (page - 1) * limit;
    const [announcements, total] = await Promise.all([
      this.announcementModel
        .find(query)
        .sort({ refreshedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.announcementModel.countDocuments(query),
    ]);

    return {
      data: announcements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
