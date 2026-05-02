import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CashoutsService } from './cashouts.service';
import { CashoutsController } from './cashouts.controller';
import { Cashout, CashoutSchema } from '../schemas/cashout.schema';
import { AuthModule } from '../auth/auth.module';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cashout.name, schema: CashoutSchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
      { name: Personnel.name, schema: PersonnelSchema },
    ]),
    AuthModule,
  ],
  controllers: [CashoutsController],
  providers: [CashoutsService],
  exports: [CashoutsService],
})
export class CashoutsModule {}
