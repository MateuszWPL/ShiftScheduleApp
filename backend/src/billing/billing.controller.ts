import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout.dto';
import { ChangePlanDto } from './dto/change-plan.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plan-status')
  @UseGuards(JwtAuthGuard)
  getPlanStatus(@CurrentUser() user: { userId: string }) {
    return this.billingService.getPlanStatus(user.userId);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  getSubscription(@CurrentUser() user: { userId: string }) {
    return this.billingService.getSubscription(user.userId);
  }

  @Get('team-limits')
  @UseGuards(JwtAuthGuard)
  getTeamLimits(@CurrentUser() user: { userId: string }) {
    return this.billingService.getTeamLimits(user.userId);
  }

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  createCheckoutSession(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(user.userId, dto);
  }

  @Post('create-portal-session')
  @UseGuards(JwtAuthGuard)
  createPortalSession(@CurrentUser() user: { userId: string }) {
    return this.billingService.createPortalSession(user.userId);
  }

  @Post('change-plan')
  @UseGuards(JwtAuthGuard)
  changePlan(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePlanDto,
  ) {
    return this.billingService.changePlan(user.userId, dto);
  }

  @Post('webhook')
  @Public()
  @SkipThrottle()
  async webhook(@Req() req: Request & { rawBody?: Buffer }) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body is required for Stripe webhook verification');
    }
    const signature = req.headers['stripe-signature'] as string | undefined;
    return this.billingService.handleWebhook(rawBody, signature);
  }
}
