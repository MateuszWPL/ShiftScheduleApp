import { IsIn } from 'class-validator';

export class ChangePlanDto {
  @IsIn(['starter', 'business'])
  targetPlanId: 'starter' | 'business';
}
