import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RentalStatus, RentalSourceType, PaymentFrequency, IdentityVerificationStatus } from '../shared/enums';

export type TransactionDocument = Transaction & Document;

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
  @Prop()
  startDate: Date;

  @Prop()
  duration: number; // in months

  @Prop()
  endDate: Date;

  @Prop()
  renewalDate: Date;

  @Prop({ type: [Date], default: [] })
  selectedDates: Date[]; // For DAILY frequency: selected available dates
}

@Schema({ _id: false })
class TransactionMetadata {
  @Prop({ type: [String], default: [] })
  documents: string[];

  @Prop()
  cinNumber: string;

  @Prop()
  numberOfPersons: number;

  @Prop()
  utilityNotes: string;

  @Prop()
  emergencyContact: string;
}

@Schema({ timestamps: true })
export class Transaction {
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

  @Prop({ type: TransactionMetadata, default: {} })
  metadata: TransactionMetadata;

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

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
