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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const rental_agency_schema_1 = require("../schemas/rental-agency.schema");
let AuthService = class AuthService {
    constructor(agencyModel, jwtService) {
        this.agencyModel = agencyModel;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.agencyModel.findOne({ email: dto.email });
        if (existing) {
            throw new common_1.BadRequestException('An agency with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const agency = await this.agencyModel.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
        });
        const { password, ...result } = agency.toObject();
        return result;
    }
    async login(dto) {
        const agency = await this.agencyModel.findOne({ email: dto.email });
        if (!agency) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, agency.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: agency._id.toString(), email: agency.email };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            agency: {
                id: agency._id,
                name: agency.name,
                email: agency.email,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(rental_agency_schema_1.RentalAgency.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map