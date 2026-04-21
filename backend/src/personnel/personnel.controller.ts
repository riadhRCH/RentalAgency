import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { PersonnelService } from './personnel.service';
import { Public } from 'src/auth/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('source') source?: string,
    @Query('status') status?: string,
  ) {
    return this.personnelService.findAll(
      parseInt(page),
      parseInt(limit),
      source,
      status,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personnelService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePersonnelDto) {
    return this.personnelService.create(dto);
  }

  @Public()
  @Post('public')
  createPublic(@Body() dto: CreatePersonnelDto) {
    return this.personnelService.createPublic(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePersonnelDto) {
    return this.personnelService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personnelService.remove(id);
  }

  @Post('identify')
  identify(@Body('phone') phone: string) {
    return this.personnelService.identify(phone);
  }

  @Get(':id/context')
  getContext(@Param('id') id: string) {
    return this.personnelService.getContext(id);
  }

  @Post(':id/generate-dashboard-token')
  generateDashboardToken(@Param('id') id: string) {
    return this.personnelService.generateDashboardToken(id);
  }

  @Public()
  @Get('dashboard/:token')
  getOwnerDashboard(@Param('token') token: string) {
    return this.personnelService.getOwnerDashboardData(token);
  }

  @Public()
  @Patch('dashboard/:token/property/:propertyId/availability')
  updatePropertyAvailability(
    @Param('token') token: string,
    @Param('propertyId') propertyId: string,
    @Body('calendarData') calendarData: any,
  ) {
    return this.personnelService.updatePropertyAvailability(token, propertyId, calendarData);
  }

  @Public()
  @Patch('dashboard/:token/property/:propertyId/price')
  updatePropertyPrice(
    @Param('token') token: string,
    @Param('propertyId') propertyId: string,
    @Body('price') price: number,
  ) {
    return this.personnelService.updatePropertyPrice(token, propertyId, price);
  }
}
