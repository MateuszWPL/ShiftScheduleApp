import { IsArray, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class PublishShiftsDto {
  @IsOptional()
  @IsArray({ message: 'shiftIds musi być tablicą' })
  @IsUUID('4', { each: true, message: 'Każdy shiftId musi być poprawnym UUID' })
  shiftIds?: string[];

  @IsOptional()
  @IsDateString({}, { message: 'from musi być prawidłową datą ISO' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to musi być prawidłową datą ISO' })
  to?: string;
}
