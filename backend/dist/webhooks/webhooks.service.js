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
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const lead_schema_1 = require("../schemas/lead.schema");
const rental_agency_schema_1 = require("../schemas/rental-agency.schema");
let WebhooksService = class WebhooksService {
    constructor(leadModel, agencyModel) {
        this.leadModel = leadModel;
        this.agencyModel = agencyModel;
    }
    generateInboundTwiml(toNumber, forwardingNumber) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record
    action="${process.env.APP_URL || 'http://localhost:3000'}/webhooks/twilio/completed"
    method="POST"
    recordingStatusCallback="${process.env.APP_URL || 'http://localhost:3000'}/webhooks/twilio/completed"
    recordingStatusCallbackMethod="POST"
    playBeep="false"
    timeout="5"
  />
  <Dial>${forwardingNumber}</Dial>
</Response>`;
    }
    async handleInbound(body) {
        const toNumber = body['To'];
        const agency = await this.agencyModel.findOne({
            'activeVirtualNumbers.phoneNumber': toNumber,
        });
        const forwardingNumber = agency?.settings?.forwardingNumber ||
            process.env.AGENCY_FORWARDING_NUMBER ||
            '';
        return this.generateInboundTwiml(toNumber, forwardingNumber);
    }
    async handleCompleted(body) {
        const callerPhone = body['From'] || body['Caller'];
        const toNumber = body['To'] || body['Called'];
        const callSid = body['CallSid'];
        const recordingUrl = body['RecordingUrl'] || null;
        const duration = body['CallDuration'] ? parseInt(body['CallDuration']) : 0;
        const agency = await this.agencyModel.findOne({
            'activeVirtualNumbers.phoneNumber': toNumber,
        });
        if (!agency) {
            console.warn(`No agency found for virtual number: ${toNumber}`);
            return;
        }
        const agencyId = agency._id;
        const newActivity = {
            type: 'CALL',
            timestamp: new Date(),
            recordingUrl,
            duration,
            metadata: body,
        };
        const existingLead = await this.leadModel.findOne({
            customerPhone: callerPhone,
            agencyId,
        });
        if (existingLead) {
            await this.leadModel.updateOne({ _id: existingLead._id }, {
                $push: { activities: newActivity },
                $set: { lastInteraction: new Date() },
            });
            console.log(`📞 Updated existing lead for ${callerPhone}`);
        }
        else {
            await this.leadModel.create({
                agencyId,
                customerPhone: callerPhone,
                status: 'NEW',
                activities: [newActivity],
                firstSeen: new Date(),
                lastInteraction: new Date(),
            });
            console.log(`🆕 Created new lead for ${callerPhone}`);
        }
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(lead_schema_1.Lead.name)),
    __param(1, (0, mongoose_1.InjectModel)(rental_agency_schema_1.RentalAgency.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map