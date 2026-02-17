import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSwapRequestDto {
  @IsUUID('4', { message: 'assignmentId musi być poprawnym UUID' })
  assignmentId: string;

  @IsOptional()
  @IsUUID('4', { message: 'targetUserId musi być poprawnym UUID' })
  targetUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Powód nie może przekraczać 500 znaków' })
  reason?: string;
}

export class AcceptSwapRequestDto {
  @IsUUID('4', { message: 'targetAssignmentId musi być poprawnym UUID' })
  targetAssignmentId: string;
}

export class SwapIdParamDto {
  @IsUUID('4', { message: 'swapId musi być poprawnym UUID' })
  swapId: string;
}
