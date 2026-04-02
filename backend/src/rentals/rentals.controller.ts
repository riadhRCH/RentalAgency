import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Patch } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';

@Controller('rentals')
@UseGuards(JwtAuthGuard, AgencyGuard)
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  async create(@Request() req, @Body() createRentalDto: CreateRentalDto) {
    const agencyId = req.user.agencyId;
    return this.rentalsService.create(agencyId, createRentalDto);
  }

  @Get()
  async findAll(@Request() req) {
    const agencyId = req.user.agencyId;
    return this.rentalsService.findAll(agencyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rentalsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.rentalsService.update(id, updateData);
  }

  @Patch(':id/close')
  async closeRental(@Param('id') id: string) {
    return this.rentalsService.closeRental(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.rentalsService.delete(id);
  }
}
