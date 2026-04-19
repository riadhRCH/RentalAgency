import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';
import { IsValidPhone } from '../../shared/validators/is-valid-phone.validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  agencyName: string;

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

  @IsString()
  @MinLength(6)
  password: string;
}
