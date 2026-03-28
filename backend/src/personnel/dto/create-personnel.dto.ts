import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreatePersonnelDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(['call', 'manual', 'registration'])
  @IsOptional()
  source?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}
