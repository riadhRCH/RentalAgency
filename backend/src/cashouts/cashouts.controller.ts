import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { CashoutsService } from './cashouts.service';
import { CreateCashoutDto } from './dto/create-cashout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';

@UseGuards(JwtAuthGuard)
@Controller('cashouts')
export class CashoutsController {
  constructor(private readonly cashoutsService: CashoutsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateCashoutDto) {
    return this.cashoutsService.create(req.user.id, dto);
  }

  @Get('owner')
  findAllByOwner(@Request() req) {
    return this.cashoutsService.findAllByOwner(req.user.id);
  }

  @UseGuards(AgencyGuard)
  @Get('agency')
  findAllByAgency(@Request() req) {
    return this.cashoutsService.findAllByAgency(req.agency._id);
  }

  @UseGuards(AgencyGuard)
  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.cashoutsService.confirm(id);
  }

  @UseGuards(AgencyGuard)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.cashoutsService.reject(id);
  }
}
