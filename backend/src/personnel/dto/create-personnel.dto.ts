import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { IsValidPhone } from '../../shared/validators/is-valid-phone.validator';
import { PreferredContact } from '../../schemas/personnel.schema';

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
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  email?: string;

  @IsEnum(PreferredContact)
  @IsOptional()
  preferredContact?: string;

  @IsUrl()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsOptional()
  telegram?: string;

  @IsEnum(['call', 'manual', 'registration'])
  @IsOptional()
  source?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}
