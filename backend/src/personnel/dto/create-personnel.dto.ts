import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsValidPhone } from '../../shared/validators/is-valid-phone.validator';

export class CreatePersonnelDto {
  @IsValidPhone()
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
