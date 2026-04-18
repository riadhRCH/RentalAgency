import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { ProvisionNumberDto } from './dto/provision-number.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @UseGuards(JwtAuthGuard, AgencyGuard)
  @Get('stats')
  async getStats(@Request() req) {
    const agencyId = req.headers['x-agency-id'];
    return this.agenciesService.getStats(agencyId);
  }

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

  // Add staff member to agency
  @UseGuards(JwtAuthGuard, AgencyGuard)
  @Post('staff')
  async addStaff(@Request() req, @Body() dto: { phone: string; role: string }) {
    return this.agenciesService.addStaff(req.agencyId.toString(), dto);
  }

  // Remove staff member from agency
  @UseGuards(JwtAuthGuard, AgencyGuard)
  @Delete('staff/:personnelId')
  async removeStaff(@Request() req, @Param('personnelId') personnelId: string) {
    return this.agenciesService.removeStaff(req.agencyId.toString(), personnelId);
  }

  // Get all staff members for the current agency
  @UseGuards(JwtAuthGuard, AgencyGuard)
  @Get('staff')
  async getStaff(@Request() req) {
    return this.agenciesService.getStaff(req.agencyId.toString());
  }
}
