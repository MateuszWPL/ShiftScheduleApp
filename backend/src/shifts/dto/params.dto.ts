import { IsUUID } from 'class-validator';

export class ShiftIdParamDto {
  @IsUUID('4', { message: 'ID zmiany musi być prawidłowym UUID' })
  id: string;
}

export class TargetIdParamDto {
  @IsUUID('4', { message: 'ID użytkownika musi być prawidłowym UUID' })
  targetId: string;
}

