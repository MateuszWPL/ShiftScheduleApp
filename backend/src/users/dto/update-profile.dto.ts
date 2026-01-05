import { IsString, IsOptional, IsUrl, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Imię i nazwisko musi być tekstem' })
  @MinLength(2, { message: 'Imię i nazwisko musi mieć minimum 2 znaki' })
  @MaxLength(100, { message: 'Imię i nazwisko może mieć maksimum 100 znaków' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Numer telefonu musi być tekstem' })
  @Matches(/^(\+?[0-9]{9,15}|)$/, {
    message: 'Numer telefonu musi być w formacie międzynarodowym (np. +48123456789) lub lokalnym (9-15 cyfr)',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

