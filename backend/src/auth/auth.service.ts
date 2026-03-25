import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.agencyModel.findOne({ email: dto.email });
    if (existing) {
      throw new BadRequestException('An agency with this email already exists');
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

  async login(dto: LoginDto) {
    const agency = await this.agencyModel.findOne({ email: dto.email });
    if (!agency) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, agency.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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
}
