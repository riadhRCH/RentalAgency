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
  startDate: string;

  @IsNumber()
  duration: number;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @IsOptional()
  @IsArray()
  selectedDates?: string[]; // For DAILY frequency
}

class RentalMetadataDto {
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

class RentalSourceDto {
  @IsEnum(['LEAD', 'VISIT', 'DIRECT'])
  sourceType: string;

  @IsOptional()
  @IsString()
  sourceId?: string;
}

export class CreateRentalDto {
  @IsString()
  propertyId: string;

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
  @Type(() => TimelineDto)
  timeline: TimelineDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RentalMetadataDto)
  metadata?: RentalMetadataDto;

  @IsOptional()
  @IsString()
  identityVerificationStatus?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RentalSourceDto)
  source?: RentalSourceDto;
}
