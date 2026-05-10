import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VisitRequestStatus } from '../shared/enums';

export type VisitRequestDocument = VisitRequest & Document;

@Schema({ timestamps: true })
export class VisitRequest {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Personnel' })
  visitorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true })
  agencyId: Types.ObjectId;

  @Prop({ type: Date })
  visitDate: Date;

  @Prop()
  visitTime: string;

  @Prop()
  customerName: string;

  @Prop()
  customerPhone: string;

  @Prop()
  customerEmail: string;

  @Prop({
    type: String,
    enum: Object.values(VisitRequestStatus),
    default: VisitRequestStatus.PENDING,
  })
  status: string;

  @Prop()
  notes: string;
}

export const VisitRequestSchema = SchemaFactory.createForClass(VisitRequest);
