import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Res } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';
import { Response } from 'express';

@Controller('contracts')
@UseGuards(JwtAuthGuard, AgencyGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  async create(@Request() req, @Body() createContractDto: CreateContractDto) {
    const agencyId = req.headers['x-agency-id'];
    return this.contractsService.create(agencyId, createContractDto);
  }

  @Get()
  async findAll(@Request() req) {
    const agencyId = req.headers['x-agency-id'];
    return this.contractsService.findAll(agencyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto) {
    return this.contractsService.update(id, updateContractDto);
  }

  @Post(':id/generate')
  async generateContract(@Param('id') id: string) {
    return this.contractsService.generateContract(id);
  }

  @Get(':id/download')
  async downloadContract(@Param('id') id: string, @Res() res: Response) {
    const fileInfo = await this.contractsService.getGeneratedFileInfo(id);
    return res.download(fileInfo.path, fileInfo.fileName);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.contractsService.delete(id);
  }
}
