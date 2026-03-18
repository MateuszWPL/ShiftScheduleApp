import { IsString, IsOptional, IsArray, IsHexColor, MinLength, MaxLength, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

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

export class BatchCreatePositionItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class BatchCreatePositionsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Podaj przynajmniej 1 stanowisko' })
  @ArrayMaxSize(20, { message: 'Maksymalnie 20 stanowisk na raz' })
  @ValidateNested({ each: true })
  @Type(() => BatchCreatePositionItemDto)
  positions: BatchCreatePositionItemDto[];
}
