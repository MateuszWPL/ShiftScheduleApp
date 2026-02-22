import { IsDateString } from 'class-validator';

export class SummaryQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
