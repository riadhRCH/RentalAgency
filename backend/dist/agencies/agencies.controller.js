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
exports.AgenciesController = void 0;
const common_1 = require("@nestjs/common");
const agencies_service_1 = require("./agencies.service");
const create_agency_dto_1 = require("./dto/create-agency.dto");
const provision_number_dto_1 = require("./dto/provision-number.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let AgenciesController = class AgenciesController {
    constructor(agenciesService) {
        this.agenciesService = agenciesService;
    }
    async create(dto) {
        return this.agenciesService.create(dto);
    }
    async provisionNumber(req, dto) {
        return this.agenciesService.provisionNumber(req.user._id.toString(), dto);
    }
    async getActiveNumbers(req) {
        return this.agenciesService.getActiveNumbers(req.user._id.toString());
    }
};
exports.AgenciesController = AgenciesController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_agency_dto_1.CreateAgencyDto]),
    __metadata("design:returntype", Promise)
], AgenciesController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('numbers/provision'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provision_number_dto_1.ProvisionNumberDto]),
    __metadata("design:returntype", Promise)
], AgenciesController.prototype, "provisionNumber", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('numbers/active'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgenciesController.prototype, "getActiveNumbers", null);
exports.AgenciesController = AgenciesController = __decorate([
    (0, common_1.Controller)('agencies'),
    __metadata("design:paramtypes", [agencies_service_1.AgenciesService])
], AgenciesController);
//# sourceMappingURL=agencies.controller.js.map