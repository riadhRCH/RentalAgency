import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { AuthModule } from '../auth/auth.module';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
      { name: Personnel.name, schema: PersonnelSchema },
    ]),
    AuthModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
