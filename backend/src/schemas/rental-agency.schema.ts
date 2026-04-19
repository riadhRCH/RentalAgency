import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop()
  areaCode: string;
}

class PaymentMethod {
  @Prop({ required: true, enum: ['bank', 'mobile', 'poste'] })
  type: string;

  @Prop({ required: true })
  provider: string;

  @Prop()
  rib?: string;

  @Prop()
  accountNumber?: string;

  @Prop({ required: true })
  accountHolder: string;

  @Prop()
  bankName?: string;
}

@Schema({ timestamps: true })
export class RentalAgency {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Personnel', required: true })
  ownerId: Types.ObjectId;

  @Prop({
    type: [{ personnelId: { type: Types.ObjectId, ref: 'Personnel' }, role: { type: String, enum: ['admin', 'agent'] } }],
    default: [],
  })
  staff: { personnelId: Types.ObjectId; role: string }[];

  @Prop({ type: [{ sid: String, phoneNumber: String, label: String }], default: [] })
  activeVirtualNumbers: VirtualNumber[];

  @Prop({ type: { forwardingNumber: String, areaCode: String }, default: {} })
  settings: AgencySettings;

  @Prop({ type: [PaymentMethod], default: [] })
  paymentMethods: PaymentMethod[];
}

export const RentalAgencySchema = SchemaFactory.createForClass(RentalAgency);
