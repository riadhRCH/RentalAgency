import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Announcement, AnnouncementSchema } from '../schemas/announcement.schema';
import { Property, PropertySchema } from '../schemas/property.schema';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { AgencyGuard } from 'src/auth/agency.guard';
import { RentalAgency, RentalAgencySchema } from 'src/schemas/rental-agency.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Announcement.name, schema: AnnouncementSchema },
      { name: Property.name, schema: PropertySchema },
       { name: RentalAgency.name, schema: RentalAgencySchema },
    ]),
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AgencyGuard],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
