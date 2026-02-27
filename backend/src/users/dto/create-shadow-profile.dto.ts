import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateShadowProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;
}

