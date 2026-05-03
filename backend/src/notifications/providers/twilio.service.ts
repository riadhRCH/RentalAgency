import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly client: twilio.Twilio;
  private readonly fromNumber: string;
  private readonly logger = new Logger(TwilioService.name);

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get('TWILIO_PHONE_NUMBER') || '';

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async sendSms(to: string, body: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Twilio client not configured');
    }

    if (!this.fromNumber) {
      throw new Error('Twilio phone number not configured');
    }

    try {
      await this.client.messages.create({
        body,
        from: this.fromNumber,
        to,
      });
      this.logger.log(`SMS sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendWhatsApp(to: string, body: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Twilio client not configured');
    }

    if (!this.fromNumber) {
      throw new Error('Twilio WhatsApp number not configured');
    }

    try {
      const whatsappFrom = `whatsapp:${this.fromNumber}`;
      const whatsappTo = `whatsapp:${to}`;
      await this.client.messages.create({
        body,
        from: whatsappFrom,
        to: whatsappTo,
      });
      this.logger.log(`WhatsApp sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp to ${to}: ${error.message}`);
      throw error;
    }
  }
}
