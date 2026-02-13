import { IsArray, IsDateString, ArrayMinSize, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilitySlotItemDto {
  @IsDateString({}, { message: 'startDateTime musi być prawidłową datą ISO' })
  startDateTime: string;

  @IsDateString({}, { message: 'endDateTime musi być prawidłową datą ISO' })
  endDateTime: string;
}

export class CreateAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotItemDto)
  @ArrayMinSize(1, { message: 'Podaj co najmniej jeden slot' })
  @ArrayMaxSize(50, { message: 'Maksymalnie 50 slotów w jednym żądaniu' })
  slots: AvailabilitySlotItemDto[];
}
