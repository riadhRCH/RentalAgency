import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';
import { Property, PropertySchema } from '../schemas/property.schema';
import { Announcement, AnnouncementSchema } from '../schemas/announcement.schema';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { VisitRequest, VisitRequestSchema } from '../schemas/visit-request.schema';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Announcement.name, schema: AnnouncementSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: VisitRequest.name, schema: VisitRequestSchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
      { name: Personnel.name, schema: PersonnelSchema },
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
