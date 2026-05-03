import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cashout, CashoutDocument, CashoutStatus } from '../schemas/cashout.schema';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { CreateCashoutDto } from './dto/create-cashout.dto';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationType } from '../schemas/notification.schema';

@Injectable()
export class CashoutsService {
  constructor(
    @InjectModel(Cashout.name)
    private readonly cashoutModel: Model<CashoutDocument>,
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(ownerId: string, dto: CreateCashoutDto) {
    const cashout = await this.cashoutModel.create({
      ...dto,
      ownerId: new Types.ObjectId(ownerId),
      agencyId: new Types.ObjectId(dto.agencyId),
      status: CashoutStatus.PENDING,
    });

    // Notify agency staff about cashout request
    const agency = await this.agencyModel.findById(dto.agencyId);
    if (agency && agency.staff && agency.staff.length > 0) {
      const cashoutLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard/cashouts`;
      for (const staffMember of agency.staff) {
        await this.notificationService.sendNotification(
          staffMember.personnelId.toString(),
          NotificationType.CASHOUT_REQUESTED,
          'Demande de Retrait',
          `Le proprietaire a demande un retrait de ${dto.amount} TND.`,
          cashoutLink,
          { cashoutId: cashout._id, amount: dto.amount },
        );
      }
    }

    return cashout;
  }

  async findAllByOwner(ownerId: string) {
    return this.cashoutModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllByAgency(agencyId: string) {
    return this.cashoutModel
      .find({ agencyId: new Types.ObjectId(agencyId) })
      .populate('ownerId', 'name phone email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async confirm(id: string) {
    const cashout = await this.cashoutModel.findById(id);
    if (!cashout) throw new BadRequestException('Cashout not found');
    if (cashout.status !== CashoutStatus.PENDING) {
      throw new BadRequestException('Cashout is already processed');
    }

    cashout.status = CashoutStatus.CONFIRMED;
    cashout.confirmedAt = new Date();
    return cashout.save();
  }

  async reject(id: string) {
    const cashout = await this.cashoutModel.findById(id);
    if (!cashout) throw new BadRequestException('Cashout not found');
    if (cashout.status !== CashoutStatus.PENDING) {
      throw new BadRequestException('Cashout is already processed');
    }

    cashout.status = CashoutStatus.REJECTED;
    return cashout.save();
  }
}
