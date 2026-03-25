import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
