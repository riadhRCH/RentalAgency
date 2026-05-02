import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PropertyType, PropertyStatus, PaymentType } from '../shared/enums';

export type PropertyDocument = Property & Document;

@Schema({ _id: false })
class GpsLocation {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;
}

@Schema({ _id: false })
class DayAvailability {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, default: true })
  isAvailable: boolean;
}

@Schema({ timestamps: true })
export class Property {
  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true })
  agencyId: Types.ObjectId;

  @Prop({ required: true })
  reference: string;

  @Prop({
    type: String,
    enum: Object.values(PropertyType),
    required: true,
  })
  type: string;

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

  @Prop()
  googleMapsLink: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: [String], default: [] })
  videos: string[];

  @Prop()
  previewVideo: string;

  @Prop({
    type: String,
    enum: Object.values(PropertyStatus),
    default: PropertyStatus.AVAILABLE,
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Personnel', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  amenities: Record<string, any>;

  @Prop({ type: [DayAvailability], default: [] })
  calendarData: DayAvailability[];

  @Prop()
  deletedAt: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ agencyId: 1, reference: 1 }, { unique: true });
