import { IsOptional, IsString } from 'class-validator';

export class UpdateAgencyProfileDto {
  @IsString()
  @IsOptional()
  logo?: string;
}
