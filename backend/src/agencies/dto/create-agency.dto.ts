import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  forwardingNumber?: string;
}
