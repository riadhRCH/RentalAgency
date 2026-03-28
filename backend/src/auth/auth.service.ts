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
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<PersonnelDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.personnelModel.findOne({ phone: dto.phone });
    if (existing && existing.passwordHash) {
      throw new BadRequestException('A person with this phone number already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    let personnel = existing;
    if (!personnel) {
      personnel = await this.personnelModel.create({
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        source: 'registration',
        passwordHash: hashedPassword,
      });
    } else {
      personnel.passwordHash = hashedPassword;
      if (dto.firstName) personnel.firstName = dto.firstName;
      if (dto.lastName) personnel.lastName = dto.lastName;
      if (dto.email) personnel.email = dto.email;
      await personnel.save();
    }

    const agency = await this.agencyModel.create({
      name: dto.agencyName,
      ownerId: personnel._id,
      staff: [{ personnelId: personnel._id, role: 'admin' }],
    });

    return {
      agency: {
        id: agency._id,
        name: agency.name,
      },
      personnel: {
        id: personnel._id,
        phone: personnel.phone,
      },
    };
  }

  async login(dto: LoginDto) {
    const personnel = await this.personnelModel.findOne({ phone: dto.phone });
    if (!personnel || !personnel.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, personnel.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find agencies where this person is staff
    const agencies = await this.agencyModel.find({
      'staff.personnelId': personnel._id,
    });

    if (agencies.length === 0) {
      throw new UnauthorizedException('No agency associated with this account');
    }

    // Update last login
    personnel.lastLoginAt = new Date();
    await personnel.save();

    const payload = { 
      sub: personnel._id.toString(), 
      phone: personnel.phone,
    };
    
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: personnel._id,
        phone: personnel.phone,
        firstName: personnel.firstName,
        lastName: personnel.lastName,
      },
    };
  }

  async getPersonnelContext(personnelId: any) {
    const agencies = await this.agencyModel.find({
      $or: [
        { ownerId: personnelId },
        { 'staff.personnelId': personnelId },
      ],
    });

    return {
      agencies: agencies.map((a) => {
        const isOwner = a.ownerId.toString() === personnelId.toString();
        const staffMember = a.staff.find(
          (s) => s.personnelId.toString() === personnelId.toString(),
        );
        return {
          id: a._id,
          name: a.name,
          role: isOwner ? 'owner' : staffMember?.role,
        };
      }),
    };
  }
}
