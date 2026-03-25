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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadSchema = exports.Lead = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Activity = class Activity {
};
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['CALL', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'MANUAL'],
        default: 'CALL',
    }),
    __metadata("design:type", String)
], Activity.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Activity.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Activity.prototype, "recordingUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Activity.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Activity.prototype, "metadata", void 0);
Activity = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Activity);
const ActivitySchema = mongoose_1.SchemaFactory.createForClass(Activity);
let Lead = class Lead {
};
exports.Lead = Lead;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'RentalAgency', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Lead.prototype, "agencyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Lead.prototype, "customerPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Lead.prototype, "customerName", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST'],
        default: 'NEW',
    }),
    __metadata("design:type", String)
], Lead.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ActivitySchema], default: [] }),
    __metadata("design:type", Array)
], Lead.prototype, "activities", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Lead.prototype, "firstSeen", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Lead.prototype, "lastInteraction", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Lead.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Lead.prototype, "notes", void 0);
exports.Lead = Lead = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Lead);
exports.LeadSchema = mongoose_1.SchemaFactory.createForClass(Lead);
//# sourceMappingURL=lead.schema.js.map