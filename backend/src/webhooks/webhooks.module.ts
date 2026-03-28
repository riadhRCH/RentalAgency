import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { PersonnelModule } from '../personnel/personnel.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
    ]),
    PersonnelModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
