import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { Contract, ContractSchema } from '../schemas/contract.schema';
import { TransactionsModule } from '../transactions/transactions.module';
import { AgenciesModule } from '../agencies/agencies.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contract.name, schema: ContractSchema }]),
    TransactionsModule,
    AgenciesModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}