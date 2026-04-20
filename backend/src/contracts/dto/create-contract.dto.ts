import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;
}