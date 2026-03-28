import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { Property, PropertySchema } from '../schemas/property.schema';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Personnel.name, schema: PersonnelSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Property.name, schema: PropertySchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
    ]),
    AuthModule,
  ],
  controllers: [PersonnelController],
  providers: [PersonnelService],
  exports: [PersonnelService],
})
export class PersonnelModule {}
