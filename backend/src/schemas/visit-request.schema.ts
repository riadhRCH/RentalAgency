import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VisitRequestStatus, PurchaseType } from '../shared/enums';

export type VisitRequestDocument = VisitRequest & Document;

@Schema({ timestamps: true })
export class VisitRequest {
  @Prop({ type: Types.ObjectId, ref: 'Property' })
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

  @Prop({ type: String })
  preferredContact: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Property' }] })
  interestedProperties: Types.ObjectId[];

  @Prop()
  availability: string;

  @Prop({ type: String, enum: Object.values(PurchaseType) })
  purchaseType: string;

  @Prop()
  budget: string;

  @Prop({ type: String, default: 'public' })
  source: string;
}

export const VisitRequestSchema = SchemaFactory.createForClass(VisitRequest);
