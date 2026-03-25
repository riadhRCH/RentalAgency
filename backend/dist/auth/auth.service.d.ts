import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly agencyModel;
    private readonly jwtService;
    constructor(agencyModel: Model<RentalAgencyDocument>, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
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
    login(dto: LoginDto): Promise<{
        access_token: string;
        agency: {
            id: any;
            name: string;
            email: string;
        };
    }>;
}
