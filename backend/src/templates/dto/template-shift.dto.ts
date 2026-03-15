import {
  IsInt,
  Min,
  Max,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class TemplateShiftDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(0)
  @Max(59)
  startMinute: number;

  @IsInt()
  @Min(0)
  @Max(23)
  endHour: number;

  @IsInt()
  @Min(0)
  @Max(59)
  endMinute: number;

  @IsString()
  roleName: string;

  @IsOptional()
  @IsUUID()
  positionId?: string;
}
