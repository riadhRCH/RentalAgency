import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CashoutsService } from './cashouts.service';
import { CreateCashoutDto } from './dto/create-cashout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';
import { OwnerDashboardGuard } from '../auth/owner-dashboard.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('cashouts')
export class CashoutsController {
  constructor(private readonly cashoutsService: CashoutsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateCashoutDto) {
    return this.cashoutsService.create(req.user.id, dto);
  }

  @UseGuards(OwnerDashboardGuard)
  @Post('dashboard')
  createFromDashboard(@Request() req, @Body() dto: CreateCashoutDto) {
    return this.cashoutsService.create(req.user._id.toString(), dto);
  }

  @Get('owner')
  findAllByOwner(@Request() req) {
    return this.cashoutsService.findAllByOwner(req.user.id);
  }

  @UseGuards(JwtAuthGuard, AgencyGuard)
  @Get('agency')
  findAllByAgency(@Request() req) {
    return this.cashoutsService.findAllByAgency(req.agency._id);
  }

  @UseGuards(OwnerDashboardGuard)
  @Get('dashboard/agency')
  findAllByAgencyForOwner(@Request() req) {
    return this.cashoutsService.findAllByAgencyForOwner(req.user._id.toString());
  }

  @UseGuards(AgencyGuard)
  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.cashoutsService.confirm(id);
  }

  @UseGuards(AgencyGuard)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.cashoutsService.reject(id);
  }
}
