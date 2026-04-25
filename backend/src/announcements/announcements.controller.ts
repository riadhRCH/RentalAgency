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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementVisibilityDto } from './dto/update-announcement-visibility.dto';

@UseGuards(JwtAuthGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Public()
  @Get('public/agency/:agencyId')
  findPublicByAgency(
    @Param('agencyId') agencyId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '12',
    @Query('query') query?: string,
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.announcementsService.findPublicByAgency(
      agencyId,
      parseInt(page, 10),
      parseInt(limit, 10),
      {
        query,
        type,
        location,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      },
    );
  }

  @UseGuards(AgencyGuard)
  @Get()
  findAllByAgency(@Request() req) {
    return this.announcementsService.findAllByAgency(req.agencyId.toString());
  }

  @UseGuards(AgencyGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.createOrRefreshFromProperty(
      req.agencyId.toString(),
      dto.propertyId,
    );
  }

  @UseGuards(AgencyGuard)
  @Patch(':id/visibility')
  updateVisibility(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementVisibilityDto,
  ) {
    return this.announcementsService.updateVisibility(
      req.agencyId.toString(),
      id,
      dto.isVisible,
    );
  }

  @UseGuards(AgencyGuard)
  @Patch(':id/refresh')
  refresh(@Request() req, @Param('id') id: string) {
    return this.announcementsService.refresh(req.agencyId.toString(), id);
  }

  @UseGuards(AgencyGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.announcementsService.remove(req.agencyId.toString(), id);
  }
}
