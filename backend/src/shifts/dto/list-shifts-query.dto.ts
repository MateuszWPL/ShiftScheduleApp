import { IsOptional, IsDateString } from 'class-validator';

export class ListShiftsQueryDto {
  /** Początek okresu grafiku (ISO date) */
  @IsOptional()
  @IsDateString({}, { message: 'from musi być datą w formacie ISO' })
  from?: string;

  /** Koniec okresu grafiku (ISO date) */
  @IsOptional()
  @IsDateString({}, { message: 'to musi być datą w formacie ISO' })
  to?: string;
}
