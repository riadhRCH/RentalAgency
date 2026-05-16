import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Demand, DemandSchema } from '../schemas/demand.schema';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { DemandsController } from './demands.controller';
import { DemandsService } from './demands.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Demand.name, schema: DemandSchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
    ]),
    AuthModule,
  ],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService],
})
export class DemandsModule {}
