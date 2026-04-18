import { IsString, IsNumber, IsDateString, IsEnum, IsOptional, ValidateNested, IsObject, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class FinancialDetailsDto {
  @IsNumber()
  rentAmount: number;

  @IsNumber()
  depositAmount: number;

  @IsOptional()
  @IsString()
  paymentFrequency?: string;
}

class TimelineDto {
  @IsDateString()
   @IsOptional()
  startDate?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @IsOptional()
  @IsArray()
  selectedDates?: string[]; // For DAILY frequency
}

class TransactionMetadataDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @IsOptional()
  @IsString()
  utilityNotes?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;
}

class TransactionSourceDto {
  @IsEnum(['LEAD', 'VISIT', 'DIRECT'])
  sourceType: string;

  @IsOptional()
  @IsString()
  sourceId?: string;
}

export class CreateTransactionDto {
  @IsString()
  propertyId: string;

  @IsOptional()
  @IsString()
  agencyId?: string;

  @IsOptional()
  @IsString()
  personnelId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => FinancialDetailsDto)
  financialDetails: FinancialDetailsDto;

  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => TimelineDto)
  timeline?: TimelineDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TransactionMetadataDto)
  metadata?: TransactionMetadataDto;

  @IsOptional()
  @IsString()
  identityVerificationStatus?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TransactionSourceDto)
  source?: TransactionSourceDto;
}
