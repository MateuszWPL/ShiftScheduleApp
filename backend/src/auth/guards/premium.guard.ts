import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PLAN_KEY } from '../decorators/premium.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipStatus } from '@prisma/client';

/**
 * Hierarchia planów — wyższy indeks = wyższy plan.
 * Business ma dostęp do wszystkiego, starter do starter i free, itd.
 */
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  starter: 1,
  business: 2,
};

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Brak dekoratora @RequirePlan — endpoint publiczny
    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      throw new ForbiddenException('Brak autoryzacji');
    }

    // Znajdź aktywne członkostwo → teamId
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId: user.userId, status: MembershipStatus.ACTIVE },
    });

    if (!membership) {
      throw new ForbiddenException('Brak aktywnego zespołu');
    }

    // Pobierz subskrypcję zespołu
    const subscription = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });

    const currentPlan = subscription?.planId ?? 'free';
    const currentStatus = subscription?.status ?? 'free';

    // Subskrypcja musi być aktywna (active/trialing) lub plan free
    const isActive =
      currentPlan === 'free' ||
      currentStatus === 'active' ||
      currentStatus === 'trialing';

    if (!isActive) {
      throw new ForbiddenException(
        'Twoja subskrypcja wygasła. Odnów plan, aby uzyskać dostęp.',
      );
    }

    // Sprawdź hierarchię: czy aktualny plan jest >= najniższy wymagany plan
    const currentLevel = PLAN_HIERARCHY[currentPlan] ?? 0;
    const minRequiredLevel = Math.min(
      ...requiredPlans.map((p) => PLAN_HIERARCHY[p] ?? 999),
    );

    if (currentLevel < minRequiredLevel) {
      const planNames = requiredPlans.join(' lub ');
      throw new ForbiddenException(
        `Ta funkcja wymaga planu ${planNames} lub wyższego. Aktualny plan: ${currentPlan}.`,
      );
    }

    return true;
  }
}
