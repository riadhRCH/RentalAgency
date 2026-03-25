import { Document, Types } from 'mongoose';
export type LeadDocument = Lead & Document;
declare class Activity {
    type: string;
    timestamp: Date;
    recordingUrl: string;
    duration: number;
    metadata: Record<string, any>;
}
export declare class Lead {
    agencyId: Types.ObjectId;
    customerPhone: string;
    customerName: string;
    status: string;
    activities: Activity[];
    firstSeen: Date;
    lastInteraction: Date;
    tags: string[];
    notes: string;
}
export declare const LeadSchema: import("mongoose").Schema<Lead, import("mongoose").Model<Lead, any, any, any, Document<unknown, any, Lead> & Lead & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Lead, Document<unknown, {}, import("mongoose").FlatRecord<Lead>> & import("mongoose").FlatRecord<Lead> & {
    _id: Types.ObjectId;
}>;
export {};
