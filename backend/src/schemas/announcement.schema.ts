import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentType, PropertyStatus, PropertyType } from '../shared/enums';

export type AnnouncementDocument = Announcement & Document;

@Schema({ _id: false })
class AnnouncementSearchIndex {
  @Prop()
  query: string;

  @Prop()
  location: string;
}

@Schema({ _id: false })
class GpsLocation {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;
}

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true, index: true })
  agencyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId: Types.ObjectId;

  @Prop({ required: true })
  reference: string;

  @Prop({ type: String, enum: Object.values(PropertyType), required: true })
  type: PropertyType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  address: string;

  @Prop({ type: GpsLocation, required: true })
  gpsLocation: GpsLocation;

  @Prop({ required: true })
  surface: number;

  @Prop({ required: true })
  price: number;

  @Prop({
    type: String,
    enum: Object.values(PaymentType),
    default: PaymentType.MONTHLY,
    required: true,
  })
  paymentFrequency: PaymentType;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop()
  previewVideo?: string;

  @Prop({
    type: String,
    enum: Object.values(PropertyStatus),
    default: PropertyStatus.AVAILABLE,
    required: true,
  })
  propertyStatus: PropertyStatus;

  @Prop({ type: Object, default: {} })
  amenities: Record<string, any>;

  @Prop({ type: AnnouncementSearchIndex, default: {} })
  searchIndex: AnnouncementSearchIndex;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ required: true })
  publishedAt: Date;

  @Prop()
  refreshedAt?: Date;

  @Prop()
  hiddenAt?: Date;

  @Prop({ default: 0 })
  views: number;

  @Prop()
  deletedAt?: Date;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
AnnouncementSchema.index(
  { agencyId: 1, propertyId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } },
);
