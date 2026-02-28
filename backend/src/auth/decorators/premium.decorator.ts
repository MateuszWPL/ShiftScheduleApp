import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PLAN_KEY = 'requiredPlan';

/**
 * Dekorator oznaczający endpoint jako wymagający minimalnego planu subskrypcji.
 * Używany razem z PremiumGuard.
 *
 * Hierarchia: free < starter < business
 *
 * Przykład: @RequirePlan('starter') — dostęp dla starter i business
 */
export const RequirePlan = (...plans: string[]) =>
  SetMetadata(REQUIRED_PLAN_KEY, plans);
