import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';

export class UpdateAgencyProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsArray()
  @IsOptional()
  @IsEnum(['rental', 'sales', 'short_term'], { each: true })
  services?: string[];
}
