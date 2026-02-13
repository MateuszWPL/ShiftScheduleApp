import { IsUUID, IsBoolean, IsOptional, ValidateIf } from 'class-validator';

export class AddAssignmentDto {
  /** Przypisanie do użytkownika (puste = wolna pozycja; przy PATCH null = odpinanie) */
  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUUID('4', { message: 'userId musi być prawidłowym UUID' })
  userId?: string | null;

  /** Czy pozycja jest na giełdzie (do przejęcia przez innego) */
  @IsOptional()
  @IsBoolean({ message: 'isUpForGrabs musi być true/false' })
  isUpForGrabs?: boolean;
}
