import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateTeamDto {
  @IsString({ message: 'Nazwa zespołu musi być tekstem' })
  @MinLength(2, { message: 'Nazwa zespołu musi mieć minimum 2 znaki' })
  @MaxLength(100, { message: 'Nazwa zespołu może mieć maksimum 100 znaków' })
  @Matches(/^[a-zA-Z0-9\s\-_ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/, {
    message: 'Nazwa zespołu może zawierać tylko litery, cyfry, spacje, myślniki i podkreślenia',
  })
  name: string;
}

