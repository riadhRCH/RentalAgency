"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const lead_schema_1 = require("../schemas/lead.schema");
let LeadsService = class LeadsService {
    constructor(leadModel) {
        this.leadModel = leadModel;
    }
    async findAll(agencyId, page = 1, limit = 20, status) {
        const query = { agencyId: new mongoose_2.Types.ObjectId(agencyId) };
        if (status)
            query.status = status;
        const skip = (page - 1) * limit;
        const [leads, total] = await Promise.all([
            this.leadModel
                .find(query)
                .sort({ lastInteraction: -1 })
                .skip(skip)
                .limit(limit),
            this.leadModel.countDocuments(query),
        ]);
        return {
            data: leads,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(agencyId, leadId) {
        const lead = await this.leadModel.findOne({
            _id: new mongoose_2.Types.ObjectId(leadId),
            agencyId: new mongoose_2.Types.ObjectId(agencyId),
        });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        return lead;
    }
    async create(agencyId, dto) {
        const lead = await this.leadModel.create({
            agencyId: new mongoose_2.Types.ObjectId(agencyId),
            customerPhone: dto.customerPhone,
            customerName: dto.customerName,
            tags: dto.tags || [],
            notes: dto.notes,
            activities: [{ type: 'MANUAL' }],
        });
        return lead;
    }
    async update(agencyId, leadId, dto) {
        const lead = await this.leadModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(leadId),
            agencyId: new mongoose_2.Types.ObjectId(agencyId),
        }, { $set: dto }, { new: true });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        return lead;
    }
    async remove(agencyId, leadId) {
        const result = await this.leadModel.findOneAndDelete({
            _id: new mongoose_2.Types.ObjectId(leadId),
            agencyId: new mongoose_2.Types.ObjectId(agencyId),
        });
        if (!result)
            throw new common_1.NotFoundException('Lead not found');
        return { message: 'Lead deleted successfully' };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(lead_schema_1.Lead.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LeadsService);
//# sourceMappingURL=leads.service.js.map