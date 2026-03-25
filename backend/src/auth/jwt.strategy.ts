import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback_secret',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const agency = await this.agencyModel.findById(payload.sub).select('-password');
    if (!agency) {
      throw new UnauthorizedException('Agency not found');
    }
    return agency;
  }
}
