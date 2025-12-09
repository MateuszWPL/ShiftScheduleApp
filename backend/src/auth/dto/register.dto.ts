import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Nieprawidłowy adres email.' })
  email: string;

  @IsString({ message: 'Imię jest wymagane.' })
  @MinLength(2, { message: 'Imię musi mieć co najmniej 2 znaki.' })
  @MaxLength(50, { message: 'Imię nie może przekraczać 50 znaków.' })
  name: string;

  @IsString({ message: 'Hasło jest wymagane.' })
  @MinLength(8, { message: 'Hasło musi mieć co najmniej 8 znaków.' })
  @MaxLength(100, { message: 'Hasło nie może przekraczać 100 znaków.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    {
      message: 'Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę.',
    }
  )
  password: string;
}

