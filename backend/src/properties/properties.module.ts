import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from '../schemas/property.schema';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { AuthModule } from '../auth/auth.module';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
      { name: Personnel.name, schema: PersonnelSchema },
    ]),
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
