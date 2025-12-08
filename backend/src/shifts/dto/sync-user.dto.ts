import { IsString, IsEmail, MinLength, MaxLength, IsOptional } from 'class-validator';

export class SyncUserDto {
  @IsEmail({}, { message: 'Email musi być prawidłowym adresem email' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Imię musi być tekstem' })
  @MinLength(1, { message: 'Imię musi mieć minimum 1 znak' })
  @MaxLength(100, { message: 'Imię może mieć maksimum 100 znaków' })
  name?: string;
}

