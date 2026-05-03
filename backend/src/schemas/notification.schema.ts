import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_PAID = 'TRANSACTION_PAID',
  TRANSACTION_CLOSED = 'TRANSACTION_CLOSED',
  PROPERTY_PRICE_CHANGED = 'PROPERTY_PRICE_CHANGED',
  PROPERTY_AVAILABILITY_CHANGED = 'PROPERTY_AVAILABILITY_CHANGED',
  CASHOUT_REQUESTED = 'CASHOUT_REQUESTED',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Personnel', required: true })
  recipientId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  link?: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  sentVia?: string;

  @Prop()
  sendError?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
