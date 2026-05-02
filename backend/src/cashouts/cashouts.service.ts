import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cashout, CashoutDocument, CashoutStatus } from '../schemas/cashout.schema';
import { CreateCashoutDto } from './dto/create-cashout.dto';

@Injectable()
export class CashoutsService {
  constructor(
    @InjectModel(Cashout.name)
    private readonly cashoutModel: Model<CashoutDocument>,
  ) {}

  async create(ownerId: string, dto: CreateCashoutDto) {
    const cashout = await this.cashoutModel.create({
      ...dto,
      ownerId: new Types.ObjectId(ownerId),
      agencyId: new Types.ObjectId(dto.agencyId),
      status: CashoutStatus.PENDING,
    });
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
