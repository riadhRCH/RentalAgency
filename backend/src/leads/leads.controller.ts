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
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.leadsService.findAll(
      req.user._id.toString(),
      parseInt(page),
      parseInt(limit),
      status,
    );
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.leadsService.findOne(req.user._id.toString(), id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(req.user._id.toString(), dto);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(req.user._id.toString(), id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.leadsService.remove(req.user._id.toString(), id);
  }
}
