import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { VisitRequest, VisitRequestDocument } from '../schemas/visit-request.schema';
import { Property, PropertyDocument } from '../schemas/property.schema';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
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
}
