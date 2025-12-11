import { IsEmail } from 'class-validator';

export class RequestResetPasswordDto {
  @IsEmail({}, { message: 'Nieprawidłowy adres email.' })
  email: string;
}

