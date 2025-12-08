import { IsArray, IsString, ArrayMinSize, ArrayMaxSize, MaxLength, MinLength } from 'class-validator';

export class UpdateEmployeeDto {
  @IsArray({ message: 'Umiejętności muszą być tablicą' })
  @ArrayMinSize(0, { message: 'Możesz podać minimum 0 umiejętności' })
  @ArrayMaxSize(20, { message: 'Możesz podać maksimum 20 umiejętności' })
  @IsString({ each: true, message: 'Każda umiejętność musi być tekstem' })
  @MinLength(1, { each: true, message: 'Każda umiejętność musi mieć minimum 1 znak' })
  @MaxLength(50, { each: true, message: 'Każda umiejętność może mieć maksimum 50 znaków' })
  skills: string[];
}

