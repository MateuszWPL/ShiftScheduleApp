import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateTemplateFromWeekDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  weekStart: string;
}
