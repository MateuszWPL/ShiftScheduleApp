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

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(private readonly prisma: PrismaService) {
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

  async getSubscription(userId: string) {
    const membership = await this.requireAdmin(userId);
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
    const priceId = dto.priceId || process.env.STRIPE_PRICE_PRO;
    if (!priceId) {
      throw new BadRequestException('Price ID is required (set STRIPE_PRICE_PRO or pass priceId)');
    }
    // FRONTEND_URL może być lista oddzielona przecinkami (CORS) — bierzemy pierwszy URL
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
    const billingReturn = `${baseUrl}/app/billing`;
    const successUrl = dto.successUrl || `${billingReturn}?success=1`;
    const cancelUrl = dto.cancelUrl || `${billingReturn}?canceled=1`;

    let sub = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });

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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { teamId: membership.teamId },
      subscription_data: {
        metadata: { teamId: membership.teamId },
        trial_period_days: 14,
      },
    });

    return { url: session.url };
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
        const planId = priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'pro';
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
          },
          update: {
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: (session.customer as string) || undefined,
            planId,
            status: stripeSub.status,
            currentPeriodEnd: periodEnd,
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
        const planId = priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'pro';
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
          await tx.subscription.update({
            where: { teamId: existing.teamId },
            data: {
              status: 'canceled',
              planId: 'free',
              stripeSubscriptionId: null,
              currentPeriodEnd: null,
            },
          });
          this.logger.log(`Subscription canceled for team ${existing.teamId}`);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        this.logger.warn(`Invoice payment failed: ${invoice.id} for customer ${invoice.customer}`);
        break;
      }
      default:
        this.logger.log(`Unhandled webhook event: ${event.type}`);
    }
  }
}
