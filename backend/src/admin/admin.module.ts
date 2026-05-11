import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';
import { Property, PropertySchema } from '../schemas/property.schema';
import { Announcement, AnnouncementSchema } from '../schemas/announcement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentalAgency.name, schema: RentalAgencySchema },
      { name: Personnel.name, schema: PersonnelSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Announcement.name, schema: AnnouncementSchema },
    ]),
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
