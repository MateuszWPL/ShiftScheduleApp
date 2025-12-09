import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Nieprawidłowy adres email.' })
  email: string;

  @IsString({ message: 'Hasło jest wymagane.' })
  password: string;
}

