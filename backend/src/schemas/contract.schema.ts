import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

@Schema({ timestamps: true })
export class Contract {
  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true })
  agencyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transactionId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: Object, default: {} })
  content: Record<string, any>; // Editable sections

  @Prop({ default: false })
  isFinalized: boolean;

  @Prop()
  generatedFileUrl?: string; // URL to the generated DOCX/PDF

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>; // Additional metadata
}

export const ContractSchema = SchemaFactory.createForClass(Contract);