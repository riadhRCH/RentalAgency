import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';
import { VisitRequestsService } from './visits.service';

@UseGuards(JwtAuthGuard, AgencyGuard)
@Controller('visits')
export class VisitRequestsController {
  constructor(private readonly visitsService: VisitRequestsService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.visitsService.findAll(
      req.agencyId.toString(),
      parseInt(page),
      parseInt(limit),
      status,
    );
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.visitsService.findOne(req.agencyId.toString(), id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.visitsService.update(req.agencyId.toString(), id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.visitsService.remove(req.agencyId.toString(), id);
  }
}
