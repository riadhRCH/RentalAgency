import { IsOptional, IsString } from 'class-validator';

export class UpdateAgencyProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  logo?: string;
}
