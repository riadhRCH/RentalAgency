import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
  ) {}

  /**
   * Generate TwiML instructions for an inbound call.
   * Records the call then dials the agency's forwarding number.
   */
  generateInboundTwiml(toNumber: string, forwardingNumber: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record
    action="${process.env.APP_URL || 'http://localhost:3000'}/webhooks/twilio/completed"
    method="POST"
    recordingStatusCallback="${process.env.APP_URL || 'http://localhost:3000'}/webhooks/twilio/completed"
    recordingStatusCallbackMethod="POST"
    playBeep="false"
    timeout="5"
  />
  <Dial>${forwardingNumber}</Dial>
</Response>`;
  }

  /**
   * Handle inbound call: look up agency by virtual number, generate TwiML.
   */
  async handleInbound(body: Record<string, string>): Promise<string> {
    const toNumber = body['To'];
    const agency = await this.agencyModel.findOne({
      'activeVirtualNumbers.phoneNumber': toNumber,
    });

    const forwardingNumber =
      agency?.settings?.forwardingNumber ||
      process.env.AGENCY_FORWARDING_NUMBER ||
      '';

    return this.generateInboundTwiml(toNumber, forwardingNumber);
  }

  /**
   * Handle call completion: upsert Lead using the "One Client = One Lead" pattern.
   */
  async handleCompleted(body: Record<string, string>): Promise<void> {
    const callerPhone = body['From'] || body['Caller'];
    const toNumber = body['To'] || body['Called'];
    const callSid = body['CallSid'];
    const recordingUrl = body['RecordingUrl'] || null;
    const duration = body['CallDuration'] ? parseInt(body['CallDuration']) : 0;

    // Find the agency that owns this virtual number
    const agency = await this.agencyModel.findOne({
      'activeVirtualNumbers.phoneNumber': toNumber,
    });

    if (!agency) {
      console.warn(`No agency found for virtual number: ${toNumber}`);
      return;
    }

    const agencyId = agency._id as Types.ObjectId;

    const newActivity = {
      type: 'CALL',
      timestamp: new Date(),
      recordingUrl,
      duration,
      metadata: body,
    };

    // Upsert: find existing lead or create a new one
    const existingLead = await this.leadModel.findOne({
      customerPhone: callerPhone,
      agencyId,
    });

    if (existingLead) {
      // Returning caller — push new activity
      await this.leadModel.updateOne(
        { _id: existingLead._id },
        {
          $push: { activities: newActivity },
          $set: { lastInteraction: new Date() },
        },
      );
      console.log(`📞 Updated existing lead for ${callerPhone}`);
    } else {
      // New caller — create lead with first activity
      await this.leadModel.create({
        agencyId,
        customerPhone: callerPhone,
        status: 'NEW',
        activities: [newActivity],
        firstSeen: new Date(),
        lastInteraction: new Date(),
      });
      console.log(`🆕 Created new lead for ${callerPhone}`);
    }
  }
}
