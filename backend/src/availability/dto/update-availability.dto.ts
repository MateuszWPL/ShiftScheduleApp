import { IsDateString } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsDateString({}, { message: 'startDateTime musi być prawidłową datą ISO' })
  startDateTime: string;

  @IsDateString({}, { message: 'endDateTime musi być prawidłową datą ISO' })
  endDateTime: string;
}
