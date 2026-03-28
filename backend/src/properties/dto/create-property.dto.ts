import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class GpsLocationDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
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

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsEnum(['available', 'reserved', 'rented', 'sold'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsObject()
  @IsOptional()
  amenities?: Record<string, any>;
}
