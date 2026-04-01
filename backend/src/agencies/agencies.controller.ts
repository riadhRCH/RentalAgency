import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { ProvisionNumberDto } from './dto/provision-number.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  // Admin: create a new agency
  @Post('create')
  async create(@Body() dto: CreateAgencyDto) {
    return this.agenciesService.create(dto);
  }

  // Provision a new Twilio virtual number for the current agency
  @UseGuards(JwtAuthGuard, AgencyGuard)
  @Post('numbers/provision')
  async provisionNumber(@Request() req, @Body() dto: ProvisionNumberDto) {
    return this.agenciesService.provisionNumber(req.agencyId.toString(), dto);
  }

  // List all active virtual numbers for the current agency
  @UseGuards(JwtAuthGuard, AgencyGuard)
  @Get('numbers/active')
  async getActiveNumbers(@Request() req) {
    return this.agenciesService.getActiveNumbers(req.agencyId.toString());
  }

  // Get current agency settings
  @UseGuards(JwtAuthGuard, AgencyGuard)
  @Get('settings')
  async getSettings(@Request() req) {
    return this.agenciesService.getSettings(req.agencyId.toString());
  }

  // Update agency settings (forwarding number, etc.)
  @UseGuards(JwtAuthGuard, AgencyGuard)
  @Patch('settings')
  async updateSettings(@Request() req, @Body() settings: any) {
    return this.agenciesService.updateSettings(req.agencyId.toString(), settings);
  }
}
