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
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@UseGuards(JwtAuthGuard, AgencyGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @Post('public')
  async createPublic(@Body() dto: CreateLeadDto) {
    return this.leadsService.createPublic(dto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('pipelineStage') pipelineStage?: string,
  ) {
    return this.leadsService.findAll(
      req.agencyId.toString(),
      parseInt(page),
      parseInt(limit),
      status,
      pipelineStage,
    );
  }

  @Get('pipeline/stats')
  getPipelineStats(@Request() req) {
    return this.leadsService.getPipelineStats(req.agencyId.toString());
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.leadsService.findOne(req.agencyId.toString(), id);
  }

  @Patch(':id/pipeline-stage')
  updatePipelineStage(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { pipelineStage: string },
  ) {
    return this.leadsService.updatePipelineStage(
      req.agencyId.toString(),
      id,
      body.pipelineStage,
    );
  }

  @Post()
  create(@Request() req, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(req.agencyId.toString(), dto);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(req.agencyId.toString(), id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.leadsService.remove(req.agencyId.toString(), id);
  }
}
