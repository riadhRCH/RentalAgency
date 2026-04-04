import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as twilio from 'twilio';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { VisitRequest, VisitRequestDocument } from '../schemas/visit-request.schema';
import { Rental, RentalDocument } from '../schemas/rental.schema';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { ProvisionNumberDto } from './dto/provision-number.dto';

const DIAL_CODE_TO_COUNTRY_CODE: Array<{ dialCode: string; countryCode: string }> = [
  { dialCode: '+971', countryCode: 'AE' },
  { dialCode: '+974', countryCode: 'QA' },
  { dialCode: '+966', countryCode: 'SA' },
  { dialCode: '+216', countryCode: 'TN' },
  { dialCode: '+213', countryCode: 'DZ' },
  { dialCode: '+212', countryCode: 'MA' },
  { dialCode: '+49', countryCode: 'DE' },
  { dialCode: '+44', countryCode: 'GB' },
  { dialCode: '+39', countryCode: 'IT' },
  { dialCode: '+34', countryCode: 'ES' },
  { dialCode: '+33', countryCode: 'FR' },
  { dialCode: '+1', countryCode: 'US' },
];

@Injectable()
export class AgenciesService {
  private twilioClient: twilio.Twilio;

  constructor(
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<PersonnelDocument>,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    @InjectModel(VisitRequest.name)
    private readonly visitRequestModel: Model<VisitRequestDocument>,
    @InjectModel(Rental.name)
    private readonly rentalModel: Model<RentalDocument>,
  ) {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  private getAgencyCountryCode(forwardingNumber?: string) {  //example +21694669601
    const normalizedForwardingNumber = (forwardingNumber || '').replace(/[\s()-]/g, '');
    const matchedCountry = DIAL_CODE_TO_COUNTRY_CODE.find(({ dialCode }) =>
      normalizedForwardingNumber.startsWith(dialCode),
    );

    return matchedCountry?.countryCode || 'TN';
  }

  async getStats(agencyId: string) {
    const objectId = new Types.ObjectId(agencyId)
    const [totalLeads, totalVisits, totalRentals] = await Promise.all([
      this.leadModel.countDocuments({  agencyId: objectId }),
      this.visitRequestModel.countDocuments({ agencyId: objectId }),
      this.rentalModel.countDocuments({ agencyId: objectId }),
    ]);

    return { totalLeads, totalVisits, totalRentals };
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
      settings: { forwardingNumber: dto.forwardingNumber || '', areaCode: '' },
    });

    return agency;
  }

  async provisionNumber(agencyId: string, dto: ProvisionNumberDto) {
    try {
      const currentAgency = await this.agencyModel.findById(agencyId).select('settings');
      if (!currentAgency) {
        throw new BadRequestException('Agency not found');
      }

      const agencyCountryCode = this.getAgencyCountryCode(
        currentAgency.settings?.forwardingNumber,
      );

      console.log('agencyCountryCode', agencyCountryCode)

      // Search for an available local number in the given area code
      const availableNumbers = await this.twilioClient
        .availablePhoneNumbers(agencyCountryCode)
        .local.list({ areaCode: Number(dto.areaCode), limit: 1 });

        console.log('availableNumbers', availableNumbers)

      if (!availableNumbers.length) {
        throw new BadRequestException(
          `No available numbers found for area code ${dto.areaCode}`,
        );
      }

      // Purchase the number
      const purchased = await this.twilioClient.incomingPhoneNumbers.create({
        phoneNumber: availableNumbers[0].phoneNumber,
        // Twilio will POST to this URL when a call comes in
        voiceUrl: `${'https://rantal-agency-backend.onrender.com'}/webhooks/twilio/inbound`, //question : will i be able to find and edit this in my twilio dashboard ?
        voiceMethod: 'POST',
        statusCallback: `${'https://rantal-agency-backend.onrender.com'}/webhooks/twilio/completed`, //question : will i be able to find and edit this in my twilio dashboard ?
        statusCallbackMethod: 'POST',
      });

      const virtualNumber = {
        sid: purchased.sid,
        phoneNumber: purchased.phoneNumber,
        label: dto.label || '',
      };

      // Save to agency document
      const updatedAgency = await this.agencyModel.findByIdAndUpdate(
        agencyId,
        { $push: { activeVirtualNumbers: virtualNumber } },
        { new: true },
      );

      return { message: 'Number provisioned successfully', virtualNumber, agency: updatedAgency };
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

  async getSettings(agencyId: string) {
    const agency = await this.agencyModel.findById(agencyId).select('settings name');
    return agency?.settings || {};
  }

  async updateSettings(agencyId: string, settings: any) {
    const agency = await this.agencyModel.findByIdAndUpdate(
      agencyId,
      { $set: { settings: settings } },
      { new: true },
    ).select('settings name');
    if (!agency) throw new BadRequestException('Agency not found');
    return agency.settings;
  }

  async addStaff(agencyId: string, dto: { phone: string; role: string }) {
    let personnel = await this.personnelModel.findOne({ phone: dto.phone });
    if (!personnel) {
      personnel = await this.personnelModel.create({
        phone: dto.phone,
        source: 'manual',
      });
    }

    const agency = await this.agencyModel.findById(agencyId);
    if (!agency) throw new BadRequestException('Agency not found');

    const isAlreadyStaff = agency.staff.some(
      (s) => s.personnelId.toString() === personnel._id.toString(),
    );

    if (isAlreadyStaff) {
      throw new BadRequestException('Personnel is already a staff member');
    }

    agency.staff.push({ personnelId: personnel._id as any, role: dto.role });
    await agency.save();

    return { message: 'Staff member added successfully', personnel };
  }

  async removeStaff(agencyId: string, personnelId: string) {
    const agency = await this.agencyModel.findById(agencyId);
    if (!agency) throw new BadRequestException('Agency not found');

    // Cannot remove owner from staff if they are the ownerId
    if (agency.ownerId.toString() === personnelId) {
      throw new BadRequestException('Cannot remove the agency owner from staff');
    }

    agency.staff = agency.staff.filter(
      (s) => s.personnelId.toString() !== personnelId,
    );
    await agency.save();

    return { message: 'Staff member removed successfully' };
  }

  async getStaff(agencyId: string) {
    const agency = await this.agencyModel
      .findById(agencyId)
      .populate('staff.personnelId')
      .select('staff');
    return agency?.staff || [];
  }
}
