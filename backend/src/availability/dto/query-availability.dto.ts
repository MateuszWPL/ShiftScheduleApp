import { IsDateString, IsOptional } from 'class-validator';

export class QueryAvailabilityDto {
  @IsOptional()
  @IsDateString({}, { message: 'from musi być datą ISO' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to musi być datą ISO' })
  to?: string;
}
