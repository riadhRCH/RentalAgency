import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RentalStatus, RentalSourceType, PaymentFrequency, IdentityVerificationStatus } from '../shared/enums';

export type RentalDocument = Rental & Document;

@Schema({ _id: false })
class FinancialDetails {
  @Prop({ required: true })
  rentAmount: number;

  @Prop({ required: true })
  depositAmount: number;

  @Prop({ 
    type: String,
    enum: Object.values(PaymentFrequency),
    default: PaymentFrequency.MONTHLY 
  })
  paymentFrequency: string;
}

@Schema({ _id: false })
class Timeline {
  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  duration: number; // in months

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  renewalDate: Date;
}

@Schema({ _id: false })
class RentalMetadata {
  @Prop({ type: [String], default: [] })
  documents: string[];

  @Prop()
  utilityNotes: string;

  @Prop()
  emergencyContact: string;
}

@Schema({ timestamps: true })
export class Rental {
  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true })
  agencyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Personnel', required: true })
  personnelId: Types.ObjectId;

  @Prop({ type: FinancialDetails, required: true })
  financialDetails: FinancialDetails;

  @Prop({ type: Timeline, required: true })
  timeline: Timeline;

  @Prop({ type: RentalMetadata, default: {} })
  metadata: RentalMetadata;

  @Prop({
    type: String,
    enum: Object.values(RentalStatus),
    default: RentalStatus.CURRENT,
  })
  status: string;

  @Prop({
    type: String,
    enum: Object.values(IdentityVerificationStatus),
    default: IdentityVerificationStatus.PENDING,
  })
  identityVerificationStatus: string;

  @Prop({
    type: {
      sourceType: { type: String, enum: Object.values(RentalSourceType) },
      sourceId: { type: Types.ObjectId },
    },
    _id: false,
  })
  source: {
    sourceType: string;
    sourceId: Types.ObjectId;
  };
}

export const RentalSchema = SchemaFactory.createForClass(Rental);
