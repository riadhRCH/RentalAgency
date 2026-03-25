import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateLeadDto {
  @IsEnum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
