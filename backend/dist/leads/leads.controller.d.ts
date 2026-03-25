import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    findAll(req: any, page?: string, limit?: string, status?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../schemas/lead.schema").LeadDocument> & import("../schemas/lead.schema").Lead & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(req: any, id: string): Promise<import("mongoose").Document<unknown, {}, import("../schemas/lead.schema").LeadDocument> & import("../schemas/lead.schema").Lead & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    create(req: any, dto: CreateLeadDto): Promise<import("mongoose").Document<unknown, {}, import("../schemas/lead.schema").LeadDocument> & import("../schemas/lead.schema").Lead & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    update(req: any, id: string, dto: UpdateLeadDto): Promise<import("mongoose").Document<unknown, {}, import("../schemas/lead.schema").LeadDocument> & import("../schemas/lead.schema").Lead & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    remove(req: any, id: string): Promise<{
        message: string;
    }>;
}
