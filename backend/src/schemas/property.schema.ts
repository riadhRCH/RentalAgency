import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ _id: false })
class GpsLocation {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;
}

@Schema({ timestamps: true })
export class Property {
  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true })
  agencyId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({
    type: String,
    enum: ['apartment', 'villa', 'house', 'land'],
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

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: [String], default: [] })
  videos: string[];

  @Prop({
    type: String,
    enum: ['available', 'reserved', 'rented', 'sold'],
    default: 'available',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Personnel', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  amenities: Record<string, any>;

  @Prop()
  deletedAt: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
