import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentalAgency.name, schema: RentalAgencySchema },
    ]),
  ],
  controllers: [AgenciesController],
  providers: [AgenciesService],
})
export class AgenciesModule {}
