import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { VisitRequest, VisitRequestSchema } from '../schemas/visit-request.schema';
import { Rental, RentalSchema } from '../schemas/rental.schema';
import { AuthModule } from '../auth/auth.module';
import { Transaction, TransactionSchema } from 'src/schemas/transaction.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentalAgency.name, schema: RentalAgencySchema },
      { name: Personnel.name, schema: PersonnelSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: VisitRequest.name, schema: VisitRequestSchema },
      { name: Rental.name, schema: RentalSchema },
       { name: Transaction.name, schema: TransactionSchema },
    ]),
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [AgenciesController],
  providers: [AgenciesService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
