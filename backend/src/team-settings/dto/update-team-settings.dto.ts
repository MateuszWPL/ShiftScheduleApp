import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

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
