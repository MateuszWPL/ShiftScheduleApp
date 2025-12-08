import { IsString, Length, Matches } from 'class-validator';

export class JoinTeamDto {
  @IsString({ message: 'Kod zespołu musi być tekstem' })
  @Length(12, 12, { message: 'Kod zespołu musi mieć dokładnie 12 znaków' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Kod zespołu może zawierać tylko litery, cyfry, myślniki i podkreślenia',
  })
  code: string;
}

