import { IsString, IsOptional, IsArray, IsHexColor, MinLength, MaxLength } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class AssignPositionsDto {
  @IsArray()
  @IsString({ each: true })
  positionIds: string[];
}
