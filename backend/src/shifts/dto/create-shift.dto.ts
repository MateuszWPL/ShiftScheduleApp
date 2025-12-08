import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ShiftStatus } from '@prisma/client';
import { IsEndTimeAfterStartTime } from './create-shift-custom.validator';

export class CreateShiftDto {
  @IsDateString({}, { message: 'startTime musi być prawidłową datą w formacie ISO' })
  startTime: string;

  @IsDateString({}, { message: 'endTime musi być prawidłową datą w formacie ISO' })
  @IsEndTimeAfterStartTime({ message: 'endTime musi być późniejsze niż startTime' })
  endTime: string;

  @IsString({ message: 'roleName jest wymagane' })
  roleName: string;

  @IsOptional()
  @IsEnum(ShiftStatus, { message: 'status musi być jednym z: DRAFT, PUBLISHED, COMPLETED' })
  status?: ShiftStatus;
}
