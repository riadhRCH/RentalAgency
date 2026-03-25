import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
export declare class LeadsService {
    private readonly leadModel;
    constructor(leadModel: Model<LeadDocument>);
    findAll(agencyId: string, page?: number, limit?: number, status?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, LeadDocument> & Lead & import("mongoose").Document<any, any, any> & {
            _id: Types.ObjectId;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(agencyId: string, leadId: string): Promise<import("mongoose").Document<unknown, {}, LeadDocument> & Lead & import("mongoose").Document<any, any, any> & {
        _id: Types.ObjectId;
    }>;
    create(agencyId: string, dto: CreateLeadDto): Promise<import("mongoose").Document<unknown, {}, LeadDocument> & Lead & import("mongoose").Document<any, any, any> & {
        _id: Types.ObjectId;
    }>;
    update(agencyId: string, leadId: string, dto: UpdateLeadDto): Promise<import("mongoose").Document<unknown, {}, LeadDocument> & Lead & import("mongoose").Document<any, any, any> & {
        _id: Types.ObjectId;
    }>;
    remove(agencyId: string, leadId: string): Promise<{
        message: string;
    }>;
}
