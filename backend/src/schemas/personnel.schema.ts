import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PersonnelDocument = Personnel & Document;

@Schema({ timestamps: true })
export class Personnel {
  @Prop({ required: true, unique: true, index: true })
  phone: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  email: string;

  @Prop({
    type: String,
    enum: ['call', 'manual', 'registration', 'public'],
    default: 'manual',
  })
  source: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  @Prop()
  passwordHash?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  deletedAt: Date;
}

export const PersonnelSchema = SchemaFactory.createForClass(Personnel);
