import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token jest wymagany.' })
  token: string;

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

