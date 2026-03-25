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
exports.RentalAgencySchema = exports.RentalAgency = void 0;
const mongoose_1 = require("@nestjs/mongoose");
class VirtualNumber {
}
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], VirtualNumber.prototype, "sid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], VirtualNumber.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VirtualNumber.prototype, "label", void 0);
class AgencySettings {
}
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AgencySettings.prototype, "forwardingNumber", void 0);
let RentalAgency = class RentalAgency {
};
exports.RentalAgency = RentalAgency;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RentalAgency.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], RentalAgency.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RentalAgency.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ sid: String, phoneNumber: String, label: String }], default: [] }),
    __metadata("design:type", Array)
], RentalAgency.prototype, "activeVirtualNumbers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { forwardingNumber: String }, default: {} }),
    __metadata("design:type", AgencySettings)
], RentalAgency.prototype, "settings", void 0);
exports.RentalAgency = RentalAgency = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], RentalAgency);
exports.RentalAgencySchema = mongoose_1.SchemaFactory.createForClass(RentalAgency);
//# sourceMappingURL=rental-agency.schema.js.map