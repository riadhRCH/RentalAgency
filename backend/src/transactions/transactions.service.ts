import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { VisitRequest, VisitRequestDocument } from '../schemas/visit-request.schema';
import { Property, PropertyDocument } from '../schemas/property.schema';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(VisitRequest.name) private visitRequestModel: Model<VisitRequestDocument>,
    @InjectModel(Personnel.name) private personnelModel: Model<PersonnelDocument>,
    @InjectModel(RentalAgency.name) private agencyModel: Model<RentalAgencyDocument>,
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

  async create(agencyId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionDocument> {
    const { propertyId, personnelId, customerName, customerPhone, source, ...transactionData } = createTransactionDto;

    let finalPersonnelId: Types.ObjectId;

    if (personnelId) {
      finalPersonnelId = new Types.ObjectId(personnelId);
    } else if (customerPhone) {
      const person = await this.identifyPersonnel(customerPhone, customerName);
      finalPersonnelId = person._id as Types.ObjectId;
    } else {
      throw new Error('Either personnelId or customerPhone/customerName is required');
    }

    // Create the transaction
    const createdTransaction = new this.transactionModel({
      ...transactionData,
      agencyId: new Types.ObjectId(agencyId),
      propertyId: new Types.ObjectId(propertyId),
      personnelId: finalPersonnelId,
      source: source ? {
        sourceType: source.sourceType,
        sourceId: source.sourceId ? new Types.ObjectId(source.sourceId) : null,
      } : null,
    });

    const savedTransaction = await createdTransaction.save();

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

    return savedTransaction;
  }

  async findAll(agencyId: string): Promise<TransactionDocument[]> {
    console.log('agencyId', agencyId)
    return this.transactionModel
      .find({ agencyId: new Types.ObjectId(agencyId) })
      .populate(['propertyId', 'personnelId'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate(['propertyId', 'personnelId'])
      .exec();
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async update(id: string, updateData: any): Promise<TransactionDocument> {
    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!updatedTransaction) {
      throw new NotFoundException('Transaction not found');
    }
    return updatedTransaction;
  }

  async closeTransaction(id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    console.log('transaction', transaction)

    // Add selected dates from transaction to property as unavailable days
    if (transaction.timeline.selectedDates && transaction.timeline.selectedDates.length > 0) {
      const property = await this.propertyModel.findById(transaction.propertyId);
      if (property) {
        // Initialize calendar data if it doesn't exist
        if (!property.calendarData) {
          property.calendarData = [];
        }

        // Add each selected date as unavailable
        for (const selectedDate of transaction.timeline.selectedDates) {
          const dateStr = new Date(selectedDate).toISOString().split('T')[0];
          
          // Check if this date already exists in calendar
          const existingIndex = property.calendarData.findIndex(day => {
            const existingDateStr = new Date(day.date).toISOString().split('T')[0];
            return existingDateStr === dateStr;
          });

          if (existingIndex !== -1) {
            // Update existing entry to mark as unavailable
            property.calendarData[existingIndex].isAvailable = false;
          } else {
            // Add new entry as unavailable
            property.calendarData.push({
              date: new Date(selectedDate),
              isAvailable: false
            } as any);
          }
        }

        // Save updated property
        await property.save();
      }
    }

    // Set status to CLOSED
    transaction.status = 'CLOSED';
    const savedTransaction = await transaction.save();

    // Reset property status to 'available'
    await this.propertyModel.findByIdAndUpdate(transaction.propertyId, { status: 'available' });

    return savedTransaction;
  }

  async delete(id: string): Promise<void> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Reset property status to 'available'
    await this.propertyModel.findByIdAndUpdate(transaction.propertyId, { status: 'available' });

    await this.transactionModel.findByIdAndDelete(id);
  }

  async findOnePublic(id: string): Promise<any> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('propertyId')
      .populate('personnelId')
      .exec();
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Get agency payment details
    const agency = await this.agencyModel.findById(transaction.agencyId).select('paymentMethods name');

    return {
      ...transaction.toObject(),
      agency: agency
    };
  }

  async updatePublic(id: string, updateData: any): Promise<TransactionDocument> {
    // Only allow updating specific fields for public access
    const allowedFields = [
      'personnelId', // for customer info
      'timeline.selectedDates', // for calendar
      'metadata.documents', // for documents
      'metadata.cinNumber', // for CIN
      'metadata.paymentProof' // for payment proof
    ];

    const filteredUpdateData = {};
    for (const field of allowedFields) {
      if (this.getNestedValue(updateData, field) !== undefined) {
        this.setNestedValue(filteredUpdateData, field, this.getNestedValue(updateData, field));
      }
    }

    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(id, filteredUpdateData, { new: true })
      .exec();
    
    if (!updatedTransaction) {
      throw new NotFoundException('Transaction not found');
    }
    return updatedTransaction;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
