import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';
import { Public } from '../auth/public.decorator';
import { VisitRequestsService } from './visits.service';

@UseGuards(JwtAuthGuard, AgencyGuard)
@Controller('visits')
export class VisitRequestsController {
  constructor(private readonly visitsService: VisitRequestsService) {}

  @Post()
  async create(@Request() req, @Body() dto: any) {
    return this.visitsService.create(req.agencyId.toString(), dto);
  }

  @Public()
  @Post('public')
  async createPublic(@Body() dto: any) {
    return this.visitsService.createPublic(dto);
  }

  @Public()
  @Get('public/:id')
  async findOnePublic(@Param('id') id: string) {
    return this.visitsService.findOnePublic(id);
  }

  @Public()
  @Patch('public/:id')
  async updatePublic(@Param('id') id: string, @Body() dto: any) {
    return this.visitsService.updatePublic(id, dto);
  }

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
