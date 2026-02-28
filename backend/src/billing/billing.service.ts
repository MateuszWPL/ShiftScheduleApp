import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, Role } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/create-checkout.dto';
import { ChangePlanDto } from './dto/change-plan.dto';
import { EmailService } from '../email/email.service';

const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  starter: 1,
  business: 2,
};

/** Limity pracowników na plan (null = bez limitu) */
const PLAN_LIMITS: Record<string, number | null> = {
  free: 5,
  starter: 15,
  business: null,
};

/** Rozpoznaje planId na podstawie priceId ze Stripe */
function resolvePlanId(priceId: string | undefined): string {
  if (!priceId) return 'starter';
  const businessPrices = [
    process.env.STRIPE_PRICE_BUSINESS,
    process.env.STRIPE_PRICE_BUSINESS_YEARLY,
  ].filter(Boolean);
  if (businessPrices.includes(priceId)) return 'business';
  return 'starter';
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      this.stripe = new Stripe(key);
    }
  }

  private ensureStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  private async requireOwner(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) throw new ForbiddenException('Brak aktywnego zespołu');
    if (membership.role !== Role.OWNER) {
      throw new ForbiddenException('Tylko właściciel może zarządzać płatnościami');
    }
    return membership;
  }

  private async requireMember(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) throw new ForbiddenException('Brak aktywnego zespołu');
    return membership;
  }

  private async requireAdmin(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) throw new ForbiddenException('Brak aktywnego zespołu');
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Brak dostępu do rozliczeń');
    }
    return membership;
  }

  /** Zlicza aktywnych członków zespołu */
  private async getMemberCount(teamId: string): Promise<number> {
    return this.prisma.teamMembership.count({
      where: { teamId, status: MembershipStatus.ACTIVE },
    });
  }

  /** Sprawdza czy zespół przekracza limit i aktualizuje flagę */
  async checkAndUpdateLimitExceeded(teamId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({
      where: { teamId },
    });
    const planId = sub?.planId ?? 'free';
    const limit = PLAN_LIMITS[planId] ?? null;
    const memberCount = await this.getMemberCount(teamId);
    const exceeded = limit !== null && memberCount > limit;

    if (sub) {
      await this.prisma.subscription.update({
        where: { teamId },
        data: { limitExceeded: exceeded },
      });
    }
    return exceeded;
  }

  /** Status planu dla dowolnego członka zespołu (badge, bramki, limity) */
  async getPlanStatus(userId: string) {
    const membership = await this.requireMember(userId);
    const sub = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });
    const planId = sub?.planId ?? 'free';
    const status = sub?.status ?? 'free';
    const isActive = planId === 'free' || status === 'active' || status === 'trialing';
    const planLevel = isActive ? (PLAN_HIERARCHY[planId] ?? 0) : 0;

    const memberCount = await this.getMemberCount(membership.teamId);
    const memberLimit = PLAN_LIMITS[planId] ?? null;
    const limitExceeded = sub?.limitExceeded ?? (memberLimit !== null && memberCount > memberLimit);

    return {
      planId,
      planLevel,
      status,
      hasStarter: planLevel >= 1,
      hasBusiness: planLevel >= 2,
      /** @deprecated użyj hasStarter */
      hasPro: planLevel >= 1,
      memberCount,
      memberLimit,
      limitExceeded,
    };
  }

  /** Szczegółowe limity zespołu — do wyświetlenia w UI */
  async getTeamLimits(userId: string) {
    const membership = await this.requireMember(userId);
    const sub = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });
    const planId = sub?.planId ?? 'free';
    const memberCount = await this.getMemberCount(membership.teamId);
    const memberLimit = PLAN_LIMITS[planId] ?? null;
    const limitExceeded = sub?.limitExceeded ?? false;

    return {
      planId,
      memberCount,
      memberLimit,
      limitExceeded,
      canAddMembers: memberLimit === null || memberCount < memberLimit,
    };
  }

  /** Szczegóły subskrypcji — tylko OWNER (billing, portal) */
  async getSubscription(userId: string) {
    const membership = await this.requireOwner(userId);
    const sub = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });
    return {
      planId: sub?.planId ?? 'free',
      status: sub?.status ?? 'free',
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      stripeCustomerId: sub?.stripeCustomerId ?? null,
    };
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDto) {
    const membership = await this.requireOwner(userId);
    const stripe = this.ensureStripe();
    const allowedPrices = [
      process.env.STRIPE_PRICE_STARTER,
      process.env.STRIPE_PRICE_STARTER_YEARLY,
      process.env.STRIPE_PRICE_BUSINESS,
      process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    ].filter(Boolean) as string[];

    // Resolve priceId: bezpośrednio z DTO, lub z planId, lub fallback na starter
    let priceId = dto.priceId;
    if (!priceId && dto.planId) {
      priceId = this.getPriceIdForPlan(dto.planId);
    }
    if (!priceId) {
      priceId = process.env.STRIPE_PRICE_STARTER;
    }
    if (!priceId) {
      throw new BadRequestException('Price ID is required (set STRIPE_PRICE_STARTER)');
    }
    if (allowedPrices.length > 0 && !allowedPrices.includes(priceId)) {
      throw new BadRequestException('Nieprawidłowy plan');
    }
    // Zawsze używamy własnych URL — nie przyjmujemy z klienta (ochrona przed open redirect)
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
    const billingReturn = `${baseUrl}/app/billing`;
    const successUrl = `${billingReturn}?success=1`;
    const cancelUrl = `${billingReturn}?canceled=1`;

    const sub = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });

    // Blokada: użytkownik z aktywną subskrypcją musi używać change-plan, nie Checkout
    // (Checkout stworzyłby nową subskrypcję, potencjalnie z kolejnym triałem)
    if (
      sub?.stripeSubscriptionId &&
      (sub.status === 'active' || sub.status === 'trialing')
    ) {
      throw new BadRequestException(
        'Masz już aktywną subskrypcję. Użyj przycisku "Ulepsz do Business+" aby zmienić plan.',
      );
    }

    let customerId = sub?.stripeCustomerId;
    if (!customerId) {
      const owner = await this.prisma.user.findFirst({
        where: { teamId: membership.teamId, role: Role.OWNER },
      });
      const customer = await stripe.customers.create({
        email: owner?.email ?? undefined,
        metadata: { teamId: membership.teamId },
      });
      customerId = customer.id;
      if (sub) {
        await this.prisma.subscription.update({
          where: { teamId: membership.teamId },
          data: { stripeCustomerId: customerId },
        });
      } else {
        await this.prisma.subscription.upsert({
          where: { teamId: membership.teamId },
          create: {
            teamId: membership.teamId,
            stripeCustomerId: customerId,
            planId: 'free',
            status: 'free',
          },
          update: { stripeCustomerId: customerId },
        });
      }
    }

    // Trial tylko raz na zespół (trialUsed w DB). Przy trialUsed nie przekazujemy trial — ceny w Stripe nie powinny mieć domyślnego trialu.
    const freshSub = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });
    // Trial 14 dni TYLKO dla Starter+ i tylko raz na zespół. Business+ — płatny od razu.
    const isStarterPlan = priceId === process.env.STRIPE_PRICE_STARTER || priceId === process.env.STRIPE_PRICE_STARTER_YEARLY;
    const trialDays = (isStarterPlan && !freshSub?.trialUsed) ? 14 : undefined;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { teamId: membership.teamId },
      subscription_data: {
        metadata: { teamId: membership.teamId },
        ...(trialDays != null ? { trial_period_days: trialDays } : {}),
      },
    });

    return { url: session.url };
  }

  /** Zmiana planu (tylko upgrade) — aktualizacja subskrypcji Stripe */
  async changePlan(userId: string, dto: ChangePlanDto) {
    const membership = await this.requireOwner(userId);
    const sub = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });
    if (!sub?.stripeSubscriptionId) {
      throw new BadRequestException('Brak aktywnej subskrypcji do zmiany');
    }
    const currentStatus = sub.status ?? 'free';
    if (currentStatus !== 'active' && currentStatus !== 'trialing') {
      throw new BadRequestException('Tylko aktywna subskrypcja może być zmieniona');
    }
    if (sub.planId === dto.targetPlanId) {
      throw new BadRequestException('Już masz ten plan');
    }

    // Blokada downgrade — tylko upgrade dozwolony
    const currentLevel = PLAN_HIERARCHY[sub.planId] ?? 0;
    const targetLevel = PLAN_HIERARCHY[dto.targetPlanId] ?? 0;
    if (targetLevel <= currentLevel) {
      throw new BadRequestException(
        'Nie można obniżyć planu. Aby przejść na niższy plan, anuluj obecną subskrypcję.',
      );
    }

    const stripe = this.ensureStripe();
    const targetPriceId = this.getPriceIdForPlan(dto.targetPlanId);
    if (!targetPriceId) {
      throw new BadRequestException(`Brak skonfigurowanej ceny dla planu ${dto.targetPlanId}`);
    }

    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) {
      throw new BadRequestException('Nie można zidentyfikować pozycji subskrypcji');
    }

    // Upgrade podczas trialu: koniec trialu natychmiast + natychmiastowa płatność (brak darmowego upgrade)
    const isTrialing = stripeSub.status === 'trialing';
    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [{ id: itemId, price: targetPriceId }],
      proration_behavior: isTrialing ? 'always_invoice' : 'create_prorations',
      metadata: { teamId: membership.teamId },
    };
    if (isTrialing) {
      updateParams.trial_end = 'now';
      updateParams.payment_behavior = 'error_if_incomplete'; // błąd jeśli płatność nie przejdzie
    }

    try {
      await stripe.subscriptions.update(sub.stripeSubscriptionId, updateParams);
    } catch (err: unknown) {
      const stripeErr = err as { code?: string; message?: string };
      if (stripeErr?.code === 'card_declined' || stripeErr?.message?.includes('card')) {
        throw new BadRequestException(
          'Płatność została odrzucona. Zaktualizuj metodę płatności w Portalu Stripe i spróbuj ponownie.',
        );
      }
      if (stripeErr?.code === 'invoice_payment_intent_requires_action') {
        throw new BadRequestException(
          'Wymagana dodatkowa weryfikacja płatności (np. 3D Secure). Otwórz Portal Stripe, zaktualizuj kartę i spróbuj ponownie.',
        );
      }
      throw err;
    }

    this.logger.log(`Plan change requested for team ${membership.teamId}: ${sub.planId} -> ${dto.targetPlanId}`);
    return { success: true };
  }

  private getPriceIdForPlan(planId: string): string | undefined {
    if (planId === 'business') {
      return process.env.STRIPE_PRICE_BUSINESS ?? process.env.STRIPE_PRICE_BUSINESS_YEARLY;
    }
    if (planId === 'starter') {
      return process.env.STRIPE_PRICE_STARTER ?? process.env.STRIPE_PRICE_STARTER_YEARLY;
    }
    return undefined;
  }

  async createPortalSession(userId: string) {
    const membership = await this.requireOwner(userId);
    const sub = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });
    if (!sub?.stripeCustomerId) {
      throw new BadRequestException('Brak aktywnej subskrypcji do zarządzania');
    }
    const stripe = this.ensureStripe();
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
    const returnUrl = `${baseUrl}/app/billing`;

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not set, skipping verification');
      throw new BadRequestException('Webhook not configured');
    }
    if (!signature) {
      throw new BadRequestException('Missing Stripe-Signature');
    }

    const stripe = this.ensureStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Invalid signature');
    }

    const existing = await this.prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (existing) {
      this.logger.log(`Webhook ${event.id} already processed, skipping`);
      return { received: true };
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.stripeWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
        },
      });
      await this.processWebhookEvent(event, tx);
    });

    return { received: true };
  }

  private async processWebhookEvent(
    event: Stripe.Event,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const teamId = session.metadata?.teamId;
        const subscriptionId = session.subscription as string;
        if (!teamId || !subscriptionId) {
          this.logger.warn(`Missing teamId or subscriptionId in checkout.session.completed`);
          return;
        }
        const stripe = this.ensureStripe();
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const stripeSub = sub as unknown as { current_period_end?: number; status: string; items: { data: { price?: { id?: string } }[] } };
        const priceId = stripeSub.items?.data?.[0]?.price?.id ?? '';
        const planId = resolvePlanId(priceId);
        const periodEnd = stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000)
          : null;
        await tx.subscription.upsert({
          where: { teamId },
          create: {
            teamId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            planId,
            status: stripeSub.status,
            currentPeriodEnd: periodEnd,
            trialUsed: true,
          },
          update: {
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: (session.customer as string) || undefined,
            planId,
            status: stripeSub.status,
            currentPeriodEnd: periodEnd,
            trialUsed: true,
          },
        });
        this.logger.log(`Subscription created/updated for team ${teamId}`);
        break;
      }
      case 'customer.subscription.updated': {
        const obj = event.data.object as unknown as Record<string, unknown>;
        const stripeSub = {
          id: obj.id as string,
          customer: obj.customer as string,
          status: obj.status as string,
          current_period_end: obj.current_period_end as number | undefined,
          metadata: obj.metadata as Record<string, string> | undefined,
          items: obj.items as { data: { price?: { id?: string } }[] },
        };
        const priceId = stripeSub.items?.data?.[0]?.price?.id;
        const planId = resolvePlanId(priceId);
        const periodEnd = stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000)
          : null;

        let existing = await tx.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        });
        if (!existing && stripeSub.metadata?.teamId) {
          existing = await tx.subscription.findUnique({
            where: { teamId: stripeSub.metadata.teamId },
          });
        }
        if (existing) {
          await tx.subscription.update({
            where: { teamId: existing.teamId },
            data: {
              stripeSubscriptionId: stripeSub.id,
              stripeCustomerId: stripeSub.customer || existing.stripeCustomerId,
              status: stripeSub.status,
              planId,
              currentPeriodEnd: periodEnd,
            },
          });
        } else if (stripeSub.metadata?.teamId) {
          await tx.subscription.upsert({
            where: { teamId: stripeSub.metadata.teamId },
            create: {
              teamId: stripeSub.metadata.teamId,
              stripeSubscriptionId: stripeSub.id,
              stripeCustomerId: stripeSub.customer,
              planId,
              status: stripeSub.status,
              currentPeriodEnd: periodEnd,
            },
            update: {
              stripeSubscriptionId: stripeSub.id,
              status: stripeSub.status,
              currentPeriodEnd: periodEnd,
              planId,
            },
          });
        } else {
          this.logger.warn(`No subscription found for stripe sub ${stripeSub.id}`);
        }
        this.logger.log(`Subscription updated: ${stripeSub.id}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const obj = event.data.object as unknown as Record<string, unknown>;
        const stripeSubId = obj.id as string;
        const existing = await tx.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
        });
        if (existing) {
          // Sprawdź limity przed degradacją
          const memberCount = await tx.teamMembership.count({
            where: { teamId: existing.teamId, status: MembershipStatus.ACTIVE },
          });
          const freeLimit = PLAN_LIMITS['free'] ?? 5;
          const exceeded = memberCount > freeLimit;

          await tx.subscription.update({
            where: { teamId: existing.teamId },
            data: {
              status: 'canceled',
              planId: 'free',
              stripeSubscriptionId: null,
              currentPeriodEnd: null,
              limitExceeded: exceeded,
            },
          });
          this.logger.log(
            `Subscription canceled for team ${existing.teamId}. Members: ${memberCount}/${freeLimit}, exceeded: ${exceeded}`,
          );
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        this.logger.warn(`Invoice payment failed: ${invoice.id} for customer ${invoice.customer}`);
        // Znajdź zespół i wyślij email do ownera
        try {
          const customerId = invoice.customer as string;
          if (customerId) {
            const sub = await tx.subscription.findFirst({
              where: { stripeCustomerId: customerId },
              include: { team: true },
            });
            if (sub) {
              const owner = await tx.user.findFirst({
                where: { teamId: sub.teamId, role: Role.OWNER },
              });
              if (owner?.email) {
                await this.emailService.sendPaymentFailedEmail(
                  owner.email,
                  owner.name,
                  sub.team.name,
                  invoice.id,
                );
              }
            }
          }
        } catch (err) {
          this.logger.error(`Error sending payment failed email: ${err}`);
        }
        break;
      }
      default:
        this.logger.log(`Unhandled webhook event: ${event.type}`);
    }
  }
}
