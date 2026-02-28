import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  /** priceId — opcjonalny, domyślnie STRIPE_PRICE_STARTER. Musi być na liście dozwolonych. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  priceId?: string;

  /** planId — 'starter' lub 'business'. Alternatywa dla priceId (backend sam dobierze cenę). */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  planId?: string;
}
