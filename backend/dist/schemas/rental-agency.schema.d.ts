import { Document } from 'mongoose';
export type RentalAgencyDocument = RentalAgency & Document;
declare class VirtualNumber {
    sid: string;
    phoneNumber: string;
    label: string;
}
declare class AgencySettings {
    forwardingNumber: string;
}
export declare class RentalAgency {
    name: string;
    email: string;
    password: string;
    activeVirtualNumbers: VirtualNumber[];
    settings: AgencySettings;
}
export declare const RentalAgencySchema: import("mongoose").Schema<RentalAgency, import("mongoose").Model<RentalAgency, any, any, any, Document<unknown, any, RentalAgency> & RentalAgency & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RentalAgency, Document<unknown, {}, import("mongoose").FlatRecord<RentalAgency>> & import("mongoose").FlatRecord<RentalAgency> & {
    _id: import("mongoose").Types.ObjectId;
}>;
export {};
