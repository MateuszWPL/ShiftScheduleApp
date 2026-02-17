import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { AnnouncementPriority } from '@prisma/client';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3, { message: 'Tytuł musi mieć co najmniej 3 znaki' })
  @MaxLength(120, { message: 'Tytuł może mieć maksymalnie 120 znaków' })
  title: string;

  @IsString()
  @MinLength(3, { message: 'Treść musi mieć co najmniej 3 znaki' })
  @MaxLength(2000, { message: 'Treść może mieć maksymalnie 2000 znaków' })
  content: string;

  @IsOptional()
  @IsEnum(AnnouncementPriority, {
    message: 'Priorytet musi być jednym z: NORMAL, IMPORTANT, URGENT',
  })
  priority?: AnnouncementPriority;

  @IsOptional()
  @IsDateString({}, { message: 'expiresAt musi być prawidłową datą ISO' })
  expiresAt?: string;
}
