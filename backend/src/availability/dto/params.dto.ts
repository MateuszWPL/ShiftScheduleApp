import { IsUUID } from 'class-validator';

export class SlotIdParamDto {
  @IsUUID('4', { message: 'ID slotu musi być prawidłowym UUID' })
  slotId: string;
}
