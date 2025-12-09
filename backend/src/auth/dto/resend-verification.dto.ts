import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Nieprawidłowy adres email.' })
  email: string;
}

