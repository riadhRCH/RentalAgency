import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ProvisionNumberDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  areaCode: number;

  @IsString()
  @IsOptional()
  label?: string;
}
