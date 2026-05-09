import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisitRequest, VisitRequestSchema } from '../schemas/visit-request.schema';
import { Property, PropertySchema } from '../schemas/property.schema';
import { VisitRequestsController } from './visits.controller';
import { VisitRequestsService } from './visits.service';
import { AuthModule } from '../auth/auth.module';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitRequest.name, schema: VisitRequestSchema },
      { name: Property.name, schema: PropertySchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
    ]),
    AuthModule,
  ],
  controllers: [VisitRequestsController],
  providers: [VisitRequestsService],
  exports: [VisitRequestsService],
})
export class VisitRequestsModule {}
