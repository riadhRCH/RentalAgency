import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy, JwtRefreshStrategy } from './jwt.strategy';
import { AgencyGuard } from './agency.guard';
import { AdminGuard } from './admin.guard';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentalAgency.name, schema: RentalAgencySchema },
      { name: Personnel.name, schema: PersonnelSchema },
    ]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret',
      signOptions: { expiresIn: '15m' }, // Short-lived access token
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, AgencyGuard, AdminGuard],
  exports: [JwtModule, AgencyGuard, AdminGuard],
})
export class AuthModule {}
