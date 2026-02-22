import { IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CopyWeekDto {
  /** ISO date string for Monday of the source week */
  @IsDateString()
  sourceWeekStart: string;

  /** ISO date string for Monday of the target week */
  @IsDateString()
  targetWeekStart: string;

  /** If true, copies shifts without employee assignments */
  @IsOptional()
  @IsBoolean()
  structureOnly?: boolean;
}
