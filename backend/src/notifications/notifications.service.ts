import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from '../schemas/notification.schema';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';
import { TwilioService } from './providers/twilio.service';
import { EmailService } from './providers/email.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(Personnel.name)
    private personnelModel: Model<PersonnelDocument>,
    private twilioService: TwilioService,
    private emailService: EmailService,
  ) {}

  async sendNotification(
    personnelId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, any>,
  ) {
    const personnel = await this.personnelModel.findOne({
      _id: new Types.ObjectId(personnelId),
      deletedAt: { $exists: false },
    });

    if (!personnel) {
      this.logger.warn(`Personnel ${personnelId} not found, skipping notification`);
      return null;
    }

    const notification = await this.notificationModel.create({
      recipientId: new Types.ObjectId(personnelId),
      type,
      title,
      message,
      link,
      metadata,
    });

    const preferredContact = personnel.preferredContact || 'PHONE';

    try {
      const sentVia = await this.dispatchNotification(
        personnel,
        preferredContact,
        title,
        message,
        link,
      );
      await this.notificationModel.findByIdAndUpdate(notification._id, { sentVia });
      this.logger.log(`Notification ${notification._id} sent via ${sentVia}`);
    } catch (error: any) {
      this.logger.error(`Failed to send notification ${notification._id}: ${error.message}`);
      await this.notificationModel.findByIdAndUpdate(notification._id, {
        sendError: error.message,
      });

      await this.tryFallback(personnel, title, message, link, notification._id);
    }

    return notification;
  }

  private async dispatchNotification(
    personnel: PersonnelDocument,
    method: string,
    title: string,
    message: string,
    link?: string,
  ): Promise<string> {
    const fullMessage = link ? `${message}\n${link}` : message;

    switch (method) {
      case 'EMAIL':
        if (!personnel.email) throw new Error('No email configured for personnel');
        await this.emailService.sendEmail(personnel.email, title, this.formatHtml(title, message, link));
        return 'EMAIL';

      case 'WHATSAPP':
        await this.twilioService.sendWhatsApp(personnel.phone, fullMessage);
        return 'WHATSAPP';

      case 'PHONE':
      case 'SMS':
        await this.twilioService.sendSms(personnel.phone, fullMessage);
        return 'SMS';

      case 'INSTAGRAM':
      case 'FACEBOOK':
      case 'TELEGRAM':
        this.logger.warn(`${method} notifications not yet implemented, falling back to SMS`);
        throw new Error(`${method} not implemented`);

      default:
        await this.twilioService.sendSms(personnel.phone, fullMessage);
        return 'SMS';
    }
  }

  private async tryFallback(
    personnel: PersonnelDocument,
    title: string,
    message: string,
    link: string | undefined,
    notificationId: Types.ObjectId,
  ) {
    const fallbackOrder = ['SMS', 'EMAIL'];

    for (const method of fallbackOrder) {
      try {
        if (method === 'SMS') {
          await this.twilioService.sendSms(personnel.phone, `${title}: ${message}${link ? '\n' + link : ''}`);
          await this.notificationModel.findByIdAndUpdate(notificationId, {
            sentVia: 'SMS (fallback)',
          });
          this.logger.log(`Fallback SMS sent to ${personnel.phone}`);
          return;
        }

        if (method === 'EMAIL' && personnel.email) {
          await this.emailService.sendEmail(personnel.email, title, this.formatHtml(title, message, link));
          await this.notificationModel.findByIdAndUpdate(notificationId, {
            sentVia: 'EMAIL (fallback)',
          });
          this.logger.log(`Fallback email sent to ${personnel.email}`);
          return;
        }
      } catch (error: any) {
        this.logger.warn(`Fallback ${method} also failed: ${error.message}`);
      }
    }
  }

  private formatHtml(title: string, message: string, link?: string): string {
    const linkHtml = link ? `<p><a href="${link}" style="color: #10b981;">${link}</a></p>` : '';
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #1e293b; color: #fff; border-radius: 12px;">
        <h2 style="color: #10b981;">${title}</h2>
        <p>${message}</p>
        ${linkHtml}
      </div>
    `;
  }

  async getNotifications(personnelId: string, page = 1, limit = 20) {
    const query = { recipientId: new Types.ObjectId(personnelId) };
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.notificationModel.countDocuments(query),
    ]);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(personnelId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      recipientId: new Types.ObjectId(personnelId),
      isRead: false,
    });
  }

  async markAsRead(notificationId: string, personnelId: string) {
    return this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(personnelId),
      },
      { $set: { isRead: true } },
      { new: true },
    );
  }

  async markAllAsRead(personnelId: string) {
    return this.notificationModel.updateMany(
      { recipientId: new Types.ObjectId(personnelId), isRead: false },
      { $set: { isRead: true } },
    );
  }
}
