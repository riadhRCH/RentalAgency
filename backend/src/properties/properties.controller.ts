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
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @UseGuards(AgencyGuard)
  @Get()
  findAll(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minSurface') minSurface?: string,
    @Query('maxSurface') maxSurface?: string,
  ) {
    return this.propertiesService.findAll(
      req.agencyId.toString(),
      parseInt(page),
      parseInt(limit),
      {
        type,
        status,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minSurface: minSurface ? parseFloat(minSurface) : undefined,
        maxSurface: maxSurface ? parseFloat(maxSurface) : undefined,
      },
    );
  }

  @UseGuards(AgencyGuard)
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.propertiesService.findOne(req.agencyId.toString(), id);
  }

  @UseGuards(AgencyGuard)
  @Post()
  create(@Request() req, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(req.agencyId.toString(), dto);
  }

  @UseGuards(AgencyGuard)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(req.agencyId.toString(), id, dto);
  }

  @UseGuards(AgencyGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.propertiesService.remove(req.agencyId.toString(), id);
  }
}
