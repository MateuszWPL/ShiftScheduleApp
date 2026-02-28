import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  /** priceId — opcjonalny, domyślnie STRIPE_PRICE_PRO. Musi być na liście dozwolonych. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  priceId?: string;
}
