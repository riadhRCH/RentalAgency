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
import { NotificationService } from '../notifications/notifications.service';
import { NotificationType } from '../schemas/notification.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(VisitRequest.name) private visitRequestModel: Model<VisitRequestDocument>,
    @InjectModel(Personnel.name) private personnelModel: Model<PersonnelDocument>,
    @InjectModel(RentalAgency.name) private agencyModel: Model<RentalAgencyDocument>,
    private notificationService: NotificationService,
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

  private buildTransactionCompletion(transaction: any) {
    const paymentFrequency = transaction.financialDetails?.paymentFrequency;
    const totalSteps = paymentFrequency === 'DAILY' ? 4 : 3;

    let stepsDone = 0;

    const hasTimeline =
      paymentFrequency === 'DAILY'
        ? (transaction.timeline?.selectedDates?.length ?? 0) > 0
        : !!transaction.timeline?.startDate && !!transaction.timeline?.endDate;

    const hasCustomer = !!transaction.personnelId?.phone;
    const hasDocuments = !!transaction.metadata?.cinNumber
      && !!transaction.metadata?.numberOfPersons
      && !!transaction.metadata?.documents?.length;
    const hasPayment = !!transaction.metadata?.paymentProof;

    if (hasTimeline) stepsDone += 1;
    if (hasCustomer) stepsDone += 1;
    if (hasDocuments) stepsDone += 1;
    if (paymentFrequency === 'DAILY' && hasPayment) {
      stepsDone += 1;
    }

    return {
      stepsDone,
      totalSteps,
      percent: Math.round((stepsDone / totalSteps) * 100),
      isComplete: stepsDone === totalSteps,
      paymentStatus: hasPayment ? 'PAID' : 'UNPAID',
    };
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

    // Notify agency staff about new transaction
    const agency = await this.agencyModel.findById(agencyId);
    if (agency && agency.staff && agency.staff.length > 0) {
      const property = await this.propertyModel.findById(propertyId);
      const transactionLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/transactions/${savedTransaction._id}`;

      for (const staffMember of agency.staff) {
        await this.notificationService.sendNotification(
          staffMember.personnelId.toString(),
          NotificationType.TRANSACTION_CREATED,
          'Nouvelle Transaction',
          `Une nouvelle transaction a ete creee pour le bien ${property?.reference || propertyId}.`,
          transactionLink,
          { transactionId: savedTransaction._id, propertyId },
        );
      }
    }

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

  async findAll(agencyId: string): Promise<any[]> {
    console.log('agencyId', agencyId)
    const transactions = await this.transactionModel
      .find({ agencyId: new Types.ObjectId(agencyId) })
      .populate(['propertyId', 'personnelId'])
      .sort({ createdAt: -1 })
      .exec();

    return transactions.map((transaction) => {
      const plainTransaction = transaction.toObject();
      return {
        ...plainTransaction,
        completion: this.buildTransactionCompletion(plainTransaction),
      };
    });
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

    // Notify property owner about closed transaction with dashboard link
    const property = await this.propertyModel.findById(transaction.propertyId);
    if (property && property.ownerId) {
      const owner = await this.personnelModel.findById(property.ownerId);
      if (owner) {
        const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/owner-dashboard/${owner.dashboardToken || ''}`;
        await this.notificationService.sendNotification(
          owner._id.toString(),
          NotificationType.TRANSACTION_CLOSED,
          'Transaction Cloturee',
          `Une transaction concernant votre bien ${property.reference} a ete cloturee. Consultez votre tableau de bord pour les details.`,
          dashboardLink,
          { transactionId: savedTransaction._id, propertyId: transaction.propertyId },
        );
      }
    }

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
      'metadata.numberOfPersons', // for occupancy details
      'metadata.paymentProof' // for payment proof
    ];

    const filteredUpdateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (this.getNestedValue(updateData, field) !== undefined) {
        filteredUpdateData[field] = this.getNestedValue(updateData, field);
      }
    }

    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(id, { $set: filteredUpdateData }, { new: true })
      .populate('personnelId propertyId')
      .exec();
    
    if (!updatedTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Notify agency when client pays
    if (filteredUpdateData['metadata.paymentProof']) {
      const refProperty = updatedTransaction.propertyId //reference
      const transaction = await this.transactionModel.findById(id).populate('agencyId');
      if (transaction) {
        const agency = await this.agencyModel.findById(transaction.agencyId);
        if (agency && agency.staff && agency.staff.length > 0) {
          const transactionLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/transactions/${id}`;
          for (const staffMember of agency.staff) {
            await this.notificationService.sendNotification(
              staffMember.personnelId.toString(),
              NotificationType.TRANSACTION_PAID,
              'Paiement Recu',
              `Un client a effectue un paiement pour la transaction de ${refProperty || 'un bien'}.`,
              transactionLink,
              { transactionId: id },
            );
          }
        }
      }
    }

    return updatedTransaction;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
