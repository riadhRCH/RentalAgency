import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VisitRequestDocument = VisitRequest & Document;

@Schema({ timestamps: true })
export class VisitRequest {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Personnel', required: true })
  visitorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true })
  agencyId: Types.ObjectId;

  @Prop({ required: true })
  visitDate: Date;

  @Prop({
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  })
  status: string;

  @Prop()
  notes: string;
}

export const VisitRequestSchema = SchemaFactory.createForClass(VisitRequest);
