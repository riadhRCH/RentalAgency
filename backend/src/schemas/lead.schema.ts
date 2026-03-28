import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeadDocument = Lead & Document;

@Schema({ _id: false })
class Activity {
  @Prop({
    type: String,
    enum: ['CALL', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'MANUAL'],
    default: 'CALL',
  })
  type: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop()
  recordingUrl: string;

  @Prop()
  duration: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

const ActivitySchema = SchemaFactory.createForClass(Activity);

@Schema({ timestamps: true })
export class Lead {
  @Prop({ type: Types.ObjectId, ref: 'RentalAgency', required: true })
  agencyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Personnel' })
  personnelId: Types.ObjectId;

  @Prop({ required: true })
  customerPhone: string;

  @Prop()
  customerName: string;

  @Prop({
    type: String,
    enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST'],
    default: 'NEW',
  })
  status: string;

  @Prop({ type: [ActivitySchema], default: [] })
  activities: Activity[];

  @Prop({ type: Date, default: Date.now })
  firstSeen: Date;

  @Prop({ type: Date, default: Date.now })
  lastInteraction: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
