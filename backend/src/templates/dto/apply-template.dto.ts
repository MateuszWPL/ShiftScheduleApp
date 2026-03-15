import { IsDateString } from 'class-validator';

export class ApplyTemplateDto {
  @IsDateString()
  targetWeekStart: string;
}
