import { IsOptional, IsString, IsObject, IsBoolean } from 'class-validator';

export class UpdateContractDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isFinalized?: boolean;

  @IsString()
  @IsOptional()
  generatedFileUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}