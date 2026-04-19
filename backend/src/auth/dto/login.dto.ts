import { IsNotEmpty, IsString } from 'class-validator';
import { IsValidPhone } from '../../shared/validators/is-valid-phone.validator';

export class LoginDto {
  @IsValidPhone()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
