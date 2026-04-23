import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Patch } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';
import { Public } from 'src/auth/public.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard, AgencyGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Public()
  @Post('public')
  async createPublic(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto.agencyId, createTransactionDto);
  }

  // Public endpoints for transaction completion page
  @Public()
  @Get('public/:id')
  async findOnePublic(@Param('id') id: string) {
    return this.transactionsService.findOnePublic(id);
  }

  @Public()
  @Patch('public/:id')
  async updatePublic(@Param('id') id: string, @Body() updateData: any) {
    return this.transactionsService.updatePublic(id, updateData);
  }

  @Post()
  async create(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    const agencyId = req.headers['x-agency-id'];
    return this.transactionsService.create(agencyId, createTransactionDto);
  }

  @Get()
  async findAll(@Request() req) {
    const agencyId = req.headers['x-agency-id'];
    return this.transactionsService.findAll(agencyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.transactionsService.update(id, updateData);
  }

  @Patch(':id/close')
  async closeTransaction(@Param('id') id: string) {
    return this.transactionsService.closeTransaction(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.transactionsService.delete(id);
  }
}
