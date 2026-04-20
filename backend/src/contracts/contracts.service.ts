import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract, ContractDocument } from '../schemas/contract.schema';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { AgenciesService } from '../agencies/agencies.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    private transactionsService: TransactionsService,
    private agenciesService: AgenciesService,
  ) {}

  async create(agencyId: string, createContractDto: CreateContractDto): Promise<ContractDocument> {
    const transaction = await this.transactionsService.findOne(createContractDto.transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const contract = new this.contractModel({
      ...createContractDto,
      agencyId: new Types.ObjectId(agencyId),
      transactionId: new Types.ObjectId(createContractDto.transactionId),
      title: createContractDto.title || `Contract for Transaction ${createContractDto.transactionId}`,
    });

    const savedContract = await contract.save();

    // Add contract to transaction metadata
    await this.transactionsService.update(createContractDto.transactionId, {
      metadata: {
        ...transaction.metadata,
        contracts: [...(transaction.metadata.contracts || []), savedContract._id.toString()],
      },
    });

    return savedContract;
  }

  async findAll(agencyId: string): Promise<ContractDocument[]> {
    return this.contractModel
      .find({ agencyId: new Types.ObjectId(agencyId) })
      .populate('transactionId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findById(id)
      .populate('transactionId')
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async update(id: string, updateContractDto: UpdateContractDto): Promise<ContractDocument> {
    const updatedContract = await this.contractModel
      .findByIdAndUpdate(id, updateContractDto, { new: true })
      .exec();

    if (!updatedContract) {
      throw new NotFoundException('Contract not found');
    }

    return updatedContract;
  }

  async delete(id: string): Promise<void> {
    const result = await this.contractModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Contract not found');
    }
  }

  async generateContract(id: string): Promise<ContractDocument> {
    // TODO: Implement contract generation logic
    // This will use docxtemplater to fill the template
    const contract = await this.findOne(id);
    // Generate and save file, update generatedFileUrl
    return contract;
  }
}