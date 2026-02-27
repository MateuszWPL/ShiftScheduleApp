import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Nieprawidłowy adres email.' })
  email: string;

  @IsString({ message: 'Hasło jest wymagane.' })
  @MaxLength(128, { message: 'Hasło nie może przekraczać 128 znaków.' })
  password: string;
}

