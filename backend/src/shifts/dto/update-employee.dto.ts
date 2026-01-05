import {
  IsArray,
  IsString,
  IsOptional,
  IsNumber,
  IsDecimal,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString({ message: 'Imię i nazwisko musi być tekstem' })
  @MinLength(2, { message: 'Imię i nazwisko musi mieć minimum 2 znaki' })
  @MaxLength(100, { message: 'Imię i nazwisko może mieć maksimum 100 znaków' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Pseudonim musi być tekstem' })
  @MaxLength(50, { message: 'Pseudonim może mieć maksimum 50 znaków' })
  nickname?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Stawka godzinowa musi być liczbą z maksymalnie 2 miejscami po przecinku' })
  @Min(0, { message: 'Stawka godzinowa nie może być ujemna' })
  @Max(999999.99, { message: 'Stawka godzinowa jest zbyt wysoka' })
  hourlyRate?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Liczba godzin musi być liczbą całkowitą' })
  @Min(0, { message: 'Liczba godzin nie może być ujemna' })
  @Max(168, { message: 'Liczba godzin nie może przekraczać 168 (tygodniowo)' })
  maxHours?: number | null;

  @IsOptional()
  @IsArray({ message: 'Umiejętności muszą być tablicą' })
  @ArrayMinSize(0, { message: 'Możesz podać minimum 0 umiejętności' })
  @ArrayMaxSize(20, { message: 'Możesz podać maksimum 20 umiejętności' })
  @IsString({ each: true, message: 'Każda umiejętność musi być tekstem' })
  @MinLength(1, { each: true, message: 'Każda umiejętność musi mieć minimum 1 znak' })
  @MaxLength(50, { each: true, message: 'Każda umiejętność może mieć maksimum 50 znaków' })
  skills?: string[];

  @IsOptional()
  @IsString({ message: 'Notatki muszą być tekstem' })
  @MaxLength(1000, { message: 'Notatki mogą mieć maksimum 1000 znaków' })
  notes?: string | null;
}
