import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rental, RentalDocument } from '../schemas/rental.schema';
import { CreateRentalDto } from './dto/create-rental.dto';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { VisitRequest, VisitRequestDocument } from '../schemas/visit-request.schema';
import { Property, PropertyDocument } from '../schemas/property.schema';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';

@Injectable()
export class RentalsService {
  constructor(
    @InjectModel(Rental.name) private rentalModel: Model<RentalDocument>,
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(VisitRequest.name) private visitRequestModel: Model<VisitRequestDocument>,
    @InjectModel(Personnel.name) private personnelModel: Model<PersonnelDocument>,
  ) {}

  private async identifyPersonnel(phone: string, name?: string): Promise<PersonnelDocument> {
    let person = await this.personnelModel.findOne({ phone });
    if (!person) {
      const [firstName, ...lastNameParts] = (name || '').split(' ');
      person = await this.personnelModel.create({
        phone,
        firstName: firstName || 'Unknown',
        lastName: lastNameParts.join(' ') || 'Customer',
        source: 'manual',
      });
    }
    return person;
  }

  async create(agencyId: string, createRentalDto: CreateRentalDto): Promise<RentalDocument> {
    const { propertyId, personnelId, customerName, customerPhone, source, ...rentalData } = createRentalDto;

    let finalPersonnelId: Types.ObjectId;

    if (personnelId) {
      finalPersonnelId = new Types.ObjectId(personnelId);
    } else if (customerPhone) {
      const person = await this.identifyPersonnel(customerPhone, customerName);
      finalPersonnelId = person._id as Types.ObjectId;
    } else {
      throw new Error('Either personnelId or customerPhone/customerName is required');
    }

    // Create the rental
    const createdRental = new this.rentalModel({
      ...rentalData,
      agencyId: new Types.ObjectId(agencyId),
      propertyId: new Types.ObjectId(propertyId),
      personnelId: finalPersonnelId,
      source: source ? {
        sourceType: source.sourceType,
        sourceId: source.sourceId ? new Types.ObjectId(source.sourceId) : null,
      } : null,
    });

    const savedRental = await createdRental.save();

    // Update property status to 'rented'
    await this.propertyModel.findByIdAndUpdate(propertyId, { status: 'rented' });

    // Handle source cleanup
    if (source && source.sourceId) {
      if (source.sourceType === 'LEAD') {
        // Archive/Delete lead. For now, let's update status to CLOSED or just delete
        // TODO-4 says "automatically archived/deleted". Let's delete to keep pipeline clean as requested.
        await this.leadModel.findByIdAndDelete(source.sourceId);
      } else if (source.sourceType === 'VISIT') {
        // Archive/Delete visit request
        await this.visitRequestModel.findByIdAndDelete(source.sourceId);
      }
    }

    return savedRental;
  }

  async findAll(agencyId: string): Promise<RentalDocument[]> {
    return this.rentalModel
      .find({ agencyId: new Types.ObjectId(agencyId) })
      .populate(['propertyId', 'personnelId'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<RentalDocument> {
    const rental = await this.rentalModel
      .findById(id)
      .populate(['propertyId', 'personnelId'])
      .exec();
    
    if (!rental) {
      throw new NotFoundException('Rental not found');
    }
    return rental;
  }

  async update(id: string, updateData: any): Promise<RentalDocument> {
    const updatedRental = await this.rentalModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!updatedRental) {
      throw new NotFoundException('Rental not found');
    }
    return updatedRental;
  }

  async closeRental(id: string): Promise<RentalDocument> {
    const rental = await this.rentalModel.findById(id);
    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    // Set status to CLOSED
    rental.status = 'CLOSED';
    const savedRental = await rental.save();

    // Reset property status to 'available'
    await this.propertyModel.findByIdAndUpdate(rental.propertyId, { status: 'available' });

    return savedRental;
  }

  async delete(id: string): Promise<void> {
    const rental = await this.rentalModel.findById(id);
    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    // Reset property status to 'available'
    await this.propertyModel.findByIdAndUpdate(rental.propertyId, { status: 'available' });

    await this.rentalModel.findByIdAndDelete(id);
  }
}
