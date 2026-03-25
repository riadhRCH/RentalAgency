import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { ProvisionNumberDto } from './dto/provision-number.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  // Admin: create a new agency
  @Post('create')
  async create(@Body() dto: CreateAgencyDto) {
    return this.agenciesService.create(dto);
  }

  // Provision a new Twilio virtual number for the current agency
  @UseGuards(JwtAuthGuard)
  @Post('numbers/provision')
  async provisionNumber(@Request() req, @Body() dto: ProvisionNumberDto) {
    return this.agenciesService.provisionNumber(req.user._id.toString(), dto);
  }

  // List all active virtual numbers for the current agency
  @UseGuards(JwtAuthGuard)
  @Get('numbers/active')
  async getActiveNumbers(@Request() req) {
    return this.agenciesService.getActiveNumbers(req.user._id.toString());
  }
}
