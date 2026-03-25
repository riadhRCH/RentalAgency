import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { ProvisionNumberDto } from './dto/provision-number.dto';
export declare class AgenciesController {
    private readonly agenciesService;
    constructor(agenciesService: AgenciesService);
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
    provisionNumber(req: any, dto: ProvisionNumberDto): Promise<{
        message: string;
        virtualNumber: {
            sid: string;
            phoneNumber: string;
            label: string;
        };
        agency: import("mongoose").Document<unknown, {}, import("../schemas/rental-agency.schema").RentalAgencyDocument> & import("../schemas/rental-agency.schema").RentalAgency & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        };
    }>;
    getActiveNumbers(req: any): Promise<{
        sid: string;
        phoneNumber: string;
        label: string;
    }[]>;
}
