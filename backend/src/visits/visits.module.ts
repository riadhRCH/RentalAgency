import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisitRequest, VisitRequestSchema } from '../schemas/visit-request.schema';
import { Property, PropertySchema } from '../schemas/property.schema';
import { Announcement, AnnouncementSchema } from '../schemas/announcement.schema';
import { VisitRequestsController } from './visits.controller';
import { VisitRequestsService } from './visits.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitRequest.name, schema: VisitRequestSchema },
      { name: Property.name, schema: PropertySchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
      { name: Announcement.name, schema: AnnouncementSchema },
      { name: Personnel.name, schema: PersonnelSchema },
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [VisitRequestsController],
  providers: [VisitRequestsService],
  exports: [VisitRequestsService],
})
export class VisitRequestsModule {}
