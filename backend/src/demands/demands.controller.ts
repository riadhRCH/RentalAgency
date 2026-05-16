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
import { DemandsService } from './demands.service';
import { CreateDemandDto } from './dto/create-demand.dto';
import { UpdateDemandDto } from './dto/update-demand.dto';

@UseGuards(JwtAuthGuard, AgencyGuard)
@Controller('demands')
export class DemandsController {
  constructor(private readonly demandsService: DemandsService) {}

  @Public()
  @Post('public')
  createPublic(@Body() body: { agencyId?: string }) {
    return this.demandsService.createPublic(body.agencyId);
  }

  @Public()
  @Get('public/:id')
  findOnePublic(@Param('id') id: string) {
    return this.demandsService.findOnePublic(id);
  }

  @Public()
  @Patch('public/:id')
  updatePublic(@Param('id') id: string, @Body() dto: any) {
    return this.demandsService.updatePublic(id, dto);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateDemandDto) {
    return this.demandsService.create(
      req.agencyId.toString(),
      req.user._id.toString(),
      dto,
    );
  }

  @Get()
  findAll(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.demandsService.findAll(
      req.agencyId.toString(),
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.demandsService.findOne(req.agencyId.toString(), id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateDemandDto) {
    return this.demandsService.update(req.agencyId.toString(), id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.demandsService.remove(req.agencyId.toString(), id);
  }
}
