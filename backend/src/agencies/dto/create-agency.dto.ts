import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  ownerPhone: string;

  @IsString()
  @IsOptional()
  forwardingNumber?: string;

  @IsString()
  @IsOptional()
  logo?: string;
}
