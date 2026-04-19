import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsValidPhone } from '../../shared/validators/is-valid-phone.validator';

export class CreateAgencyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsValidPhone()
  @IsNotEmpty()
  ownerPhone: string;

  @IsString()
  @IsOptional()
  forwardingNumber?: string;
}
