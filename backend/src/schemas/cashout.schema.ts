import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CashoutDocument = Cashout & Document;

export enum CashoutStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Cashout {
  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true })
  agencyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Personnel', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({
    type: String,
    enum: Object.values(CashoutStatus),
    default: CashoutStatus.PENDING,
  })
  status: CashoutStatus;

  @Prop()
  notes?: string;

  @Prop()
  confirmedAt?: Date;
}

export const CashoutSchema = SchemaFactory.createForClass(Cashout);
