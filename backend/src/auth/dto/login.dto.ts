import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
