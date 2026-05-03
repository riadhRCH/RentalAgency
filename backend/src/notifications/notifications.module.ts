import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';
import { NotificationsController } from './notifications.controller';
import { TwilioService } from './providers/twilio.service';
import { EmailService } from './providers/email.service';
import { NotificationService } from './notifications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Personnel.name, schema: PersonnelSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, TwilioService, EmailService],
  exports: [NotificationService],
})
export class NotificationsModule {}
