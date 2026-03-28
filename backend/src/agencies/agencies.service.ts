import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as twilio from 'twilio';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { ProvisionNumberDto } from './dto/provision-number.dto';

@Injectable()
export class AgenciesService {
  private twilioClient: twilio.Twilio;

  constructor(
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<PersonnelDocument>,
  ) {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async create(dto: CreateAgencyDto) {
    let personnel = await this.personnelModel.findOne({ phone: dto.ownerPhone });
    
    if (!personnel) {
      personnel = await this.personnelModel.create({
        phone: dto.ownerPhone,
        source: 'manual',
      });
    }

    const agency = await this.agencyModel.create({
      name: dto.name,
      ownerId: personnel._id,
      staff: [{ personnelId: personnel._id, role: 'admin' }],
      settings: { forwardingNumber: dto.forwardingNumber || '' },
    });

    return agency;
  }

  async provisionNumber(agencyId: string, dto: ProvisionNumberDto) {
    try {
      // Search for an available local number in the given area code
      const availableNumbers = await this.twilioClient
        .availablePhoneNumbers('US')
        .local.list({ areaCode: Number(dto.areaCode), limit: 1 });

      if (!availableNumbers.length) {
        throw new BadRequestException(
          `No available numbers found for area code ${dto.areaCode}`,
        );
      }

      // Purchase the number
      const purchased = await this.twilioClient.incomingPhoneNumbers.create({
        phoneNumber: availableNumbers[0].phoneNumber,
        // Twilio will POST to this URL when a call comes in
        voiceUrl: `${process.env.APP_URL || 'http://localhost:3000'}/webhooks/twilio/inbound`,
        voiceMethod: 'POST',
        statusCallback: `${process.env.APP_URL || 'http://localhost:3000'}/webhooks/twilio/completed`,
        statusCallbackMethod: 'POST',
      });

      const virtualNumber = {
        sid: purchased.sid,
        phoneNumber: purchased.phoneNumber,
        label: dto.label || '',
      };

      // Save to agency document
      const agency = await this.agencyModel.findByIdAndUpdate(
        agencyId,
        { $push: { activeVirtualNumbers: virtualNumber } },
        { new: true },
      );

      return { message: 'Number provisioned successfully', virtualNumber, agency };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        `Twilio error: ${error.message || error}`,
      );
    }
  }

  async getActiveNumbers(agencyId: string) {
    const agency = await this.agencyModel.findById(agencyId).select('activeVirtualNumbers name');
    return agency?.activeVirtualNumbers || [];
  }
}
