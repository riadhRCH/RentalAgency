import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  IsDateString,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentFrequency } from 'src/shared/enums';

class GpsLocationDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

class DayAvailabilityDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}

export class CreatePropertyDto {
  @IsEnum(['apartment', 'villa', 'house', 'land'])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @ValidateNested()
  @Type(() => GpsLocationDto)
  @IsNotEmpty()
  gpsLocation: GpsLocationDto;

  @IsNumber()
  @IsNotEmpty()
  surface: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsEnum(PaymentFrequency)
  @IsNotEmpty()
  paymentFrequency: PaymentFrequency;

  @IsString()
  @IsOptional()
  googleMapsLink?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsString()
  @IsOptional()
  previewVideo?: string;

  @IsEnum(['available', 'reserved', 'rented', 'sold'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsObject()
  @IsOptional()
  amenities?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayAvailabilityDto)
  @IsOptional()
  calendarData?: DayAvailabilityDto[];
}
