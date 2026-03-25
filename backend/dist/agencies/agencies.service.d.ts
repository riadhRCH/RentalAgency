import { Model } from 'mongoose';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { ProvisionNumberDto } from './dto/provision-number.dto';
export declare class AgenciesService {
    private readonly agencyModel;
    private twilioClient;
    constructor(agencyModel: Model<RentalAgencyDocument>);
    create(dto: CreateAgencyDto): Promise<{
        name: string;
        email: string;
        activeVirtualNumbers: {
            sid: string;
            phoneNumber: string;
            label: string;
        }[];
        settings: {
            forwardingNumber: string;
        };
        _id: any;
        __v?: any;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        id?: any;
        isNew: boolean;
        schema: import("mongoose").Schema;
    }>;
    provisionNumber(agencyId: string, dto: ProvisionNumberDto): Promise<{
        message: string;
        virtualNumber: {
            sid: string;
            phoneNumber: string;
            label: string;
        };
        agency: import("mongoose").Document<unknown, {}, RentalAgencyDocument> & RentalAgency & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        };
    }>;
    getActiveNumbers(agencyId: string): Promise<{
        sid: string;
        phoneNumber: string;
        label: string;
    }[]>;
}
