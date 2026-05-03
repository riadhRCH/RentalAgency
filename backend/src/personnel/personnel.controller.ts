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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { PersonnelService } from './personnel.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Public } from 'src/auth/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('personnel')
export class PersonnelController {
  constructor(
    private readonly personnelService: PersonnelService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  @UseGuards(AgencyGuard)
  @Get('owners')
  findOwnersByAgency(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.personnelService.findOwnersByAgency(
      req.agencyId.toString(),
      parseInt(page),
      parseInt(limit),
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

  @Post(':id/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const result = await this.cloudinaryService.uploadImage(file);
    const profilePictureUrl = (result as any).secure_url;

    await this.personnelService.update(id, { profilePicture: profilePictureUrl });

    return {
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl,
    };
  }
}
