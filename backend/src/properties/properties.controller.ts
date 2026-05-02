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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';
import { Public } from '../auth/public.decorator';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(AgencyGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadImage(file);
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  }

  @UseGuards(AgencyGuard)
  @Post('upload-video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadVideo(file);
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  }

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
