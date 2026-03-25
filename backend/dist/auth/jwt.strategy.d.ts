import { Strategy } from 'passport-jwt';
import { Model } from 'mongoose';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly agencyModel;
    constructor(agencyModel: Model<RentalAgencyDocument>);
    validate(payload: {
        sub: string;
        email: string;
    }): Promise<import("mongoose").Document<unknown, {}, RentalAgencyDocument> & RentalAgency & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
}
export {};
