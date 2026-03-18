import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MaxLength,
  ValidateNested,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTeamSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Nazwa firmy może mieć maks. 100 znaków' })
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  defaultOpenHour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  defaultCloseHour?: number;

  @IsOptional()
  @IsInt()
  @Min(60, { message: 'Minimalna długość zmiany to 60 minut (1h)' })
  @Max(1440, { message: 'Maksymalna długość zmiany to 1440 minut (24h)' })
  minShiftDurationMin?: number;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(1440)
  maxShiftDurationMin?: number;

  @IsOptional()
  @IsBoolean()
  notifyShiftAssigned?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyShiftPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyMarketplace?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyAnnouncements?: boolean;
}

export class UpdateTeamNameDto {
  @IsString()
  @MaxLength(100, { message: 'Nazwa zespołu może mieć maks. 100 znaków' })
  name: string;
}

export class BusinessHoursDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsBoolean()
  isOpen: boolean;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'openTime musi być w formacie HH:mm' })
  openTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'closeTime musi być w formacie HH:mm' })
  closeTime: string;
}

export class InviteByEmailDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Podaj przynajmniej 1 email' })
  @ArrayMaxSize(5, { message: 'Maksymalnie 5 emaili na raz' })
  @IsString({ each: true })
  emails: string[];
}

export class UpdateBusinessHoursDto {
  @IsArray()
  @ArrayMinSize(7, { message: 'Wymagane 7 dni tygodnia' })
  @ArrayMaxSize(7, { message: 'Wymagane 7 dni tygodnia' })
  @ValidateNested({ each: true })
  @Type(() => BusinessHoursDayDto)
  days: BusinessHoursDayDto[];
}
