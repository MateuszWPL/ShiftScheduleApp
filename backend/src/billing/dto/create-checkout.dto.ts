import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  priceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  successUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cancelUrl?: string;
}
