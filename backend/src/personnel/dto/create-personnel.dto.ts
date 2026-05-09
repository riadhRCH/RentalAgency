import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { PreferredContact } from '../../schemas/personnel.schema';

export class CreatePersonnelDto {
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
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
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

  @IsIn(['call', 'manual', 'registration'])
  @IsOptional()
  source?: string;

  @IsIn(['active', 'inactive'])
  @IsOptional()
  status?: string;
}
