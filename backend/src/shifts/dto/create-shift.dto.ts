import { IsString, IsDateString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ShiftStatus } from '@prisma/client';
import { IsEndTimeAfterStartTime } from './create-shift-custom.validator';

export class CreateShiftDto {
  @IsDateString({}, { message: 'startTime musi być prawidłową datą w formacie ISO' })
  startTime: string;

  @IsDateString({}, { message: 'endTime musi być prawidłową datą w formacie ISO' })
  @IsEndTimeAfterStartTime({ message: 'endTime musi być późniejsze niż startTime' })
  endTime: string;

  @IsOptional()
  @IsString({ message: 'roleName jest wymagane' })
  @MaxLength(100)
  roleName?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsEnum(ShiftStatus, { message: 'status musi być jednym z: DRAFT, PUBLISHED, COMPLETED' })
  status?: ShiftStatus;
}
