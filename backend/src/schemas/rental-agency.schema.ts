import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RentalAgencyDocument = RentalAgency & Document;

class VirtualNumber {
  @Prop({ required: true })
  sid: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop()
  label: string;
}

class AgencySettings {
  @Prop()
  forwardingNumber: string;
}

@Schema({ timestamps: true })
export class RentalAgency {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [{ sid: String, phoneNumber: String, label: String }], default: [] })
  activeVirtualNumbers: VirtualNumber[];

  @Prop({ type: { forwardingNumber: String }, default: {} })
  settings: AgencySettings;
}

export const RentalAgencySchema = SchemaFactory.createForClass(RentalAgency);
