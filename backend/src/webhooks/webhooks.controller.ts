import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * POST /webhooks/twilio/inbound
   * Twilio calls this URL when a customer dials a virtual number.
   * Returns TwiML to record and bridge the call.
   */
  @Post('twilio/inbound')
  @HttpCode(200)
  async inbound(@Body() body: Record<string, string>, @Res() res: Response) {
    const twiml = await this.webhooksService.handleInbound(body);
    res.set('Content-Type', 'text/xml');
    res.send(twiml);
  }

  /**
   * POST /webhooks/twilio/completed
   * Twilio calls this after the call ends (StatusCallback).
   * Runs the upsert logic to create/update a Lead.
   */
  @Post('twilio/completed')
  @HttpCode(200)
  async completed(@Body() body: Record<string, string>) {
    await this.webhooksService.handleCompleted(body);
    return { received: true };
  }
}
