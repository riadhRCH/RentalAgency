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
exports.AgenciesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
const twilio = require("twilio");
const rental_agency_schema_1 = require("../schemas/rental-agency.schema");
let AgenciesService = class AgenciesService {
    constructor(agencyModel) {
        this.agencyModel = agencyModel;
        this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
    async create(dto) {
        const existing = await this.agencyModel.findOne({ email: dto.email });
        if (existing) {
            throw new common_1.BadRequestException('Agency with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const agency = await this.agencyModel.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            settings: { forwardingNumber: dto.forwardingNumber || '' },
        });
        const { password, ...result } = agency.toObject();
        return result;
    }
    async provisionNumber(agencyId, dto) {
        try {
            const availableNumbers = await this.twilioClient
                .availablePhoneNumbers('US')
                .local.list({ areaCode: Number(dto.areaCode), limit: 1 });
            if (!availableNumbers.length) {
                throw new common_1.BadRequestException(`No available numbers found for area code ${dto.areaCode}`);
            }
            const purchased = await this.twilioClient.incomingPhoneNumbers.create({
                phoneNumber: availableNumbers[0].phoneNumber,
                voiceUrl: `${process.env.APP_URL || 'http://localhost:3000'}/webhooks/twilio/inbound`,
                voiceMethod: 'POST',
                statusCallback: `${process.env.APP_URL || 'http://localhost:3000'}/webhooks/twilio/completed`,
                statusCallbackMethod: 'POST',
            });
            const virtualNumber = {
                sid: purchased.sid,
                phoneNumber: purchased.phoneNumber,
                label: dto.label || '',
            };
            const agency = await this.agencyModel.findByIdAndUpdate(agencyId, { $push: { activeVirtualNumbers: virtualNumber } }, { new: true });
            return { message: 'Number provisioned successfully', virtualNumber, agency };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(`Twilio error: ${error.message || error}`);
        }
    }
    async getActiveNumbers(agencyId) {
        const agency = await this.agencyModel.findById(agencyId).select('activeVirtualNumbers name');
        return agency?.activeVirtualNumbers || [];
    }
};
exports.AgenciesService = AgenciesService;
exports.AgenciesService = AgenciesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(rental_agency_schema_1.RentalAgency.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AgenciesService);
//# sourceMappingURL=agencies.service.js.map