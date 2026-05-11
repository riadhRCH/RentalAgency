import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('agencies')
  async findAllAgencies() {
    return this.adminService.findAllAgencies();
  }

  @Delete('agencies/:id')
  async removeAgency(
    @Param('id') id: string,
    @Query('deleteProperties') deleteProperties: string,
    @Query('deletePersonnel') deletePersonnel: string,
  ) {
    const delProps = deleteProperties !== 'false';
    const delPersonnel = deletePersonnel !== 'false';
    return this.adminService.removeAgency(id, delProps, delPersonnel);
  }
}
