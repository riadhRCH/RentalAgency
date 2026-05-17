import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DemandDocument = Demand & Document;

@Schema({ timestamps: true })
export class Demand {
  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true })
  agencyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Personnel' })
  personnelId?: Types.ObjectId;

  @Prop()
  customerName?: string;

  @Prop()
  customerEmail?: string;

  @Prop({ type: [String] })
  nbBedrooms?: string[];

  @Prop({ type: [String] })
  mustHaveFeatures?: string[];

  @Prop()
  additionalNotes?: string;

  @Prop()
  budget?: string;

  @Prop({
    type: String,
    enum: ['NEW', 'CONTACTED', 'MATCHED', 'CLOSED'],
    default: 'NEW',
  })
  status: string;
}

export const DemandSchema = SchemaFactory.createForClass(Demand);
