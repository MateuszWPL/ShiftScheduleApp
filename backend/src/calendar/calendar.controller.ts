import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Header,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PremiumGuard } from '../auth/guards/premium.guard';
import { RequirePlan } from '../auth/decorators/premium.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { IsDateString } from 'class-validator';

class CalendarRangeQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('export-ics')
  @UseGuards(JwtAuthGuard, PremiumGuard)
  @RequirePlan('starter')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async exportIcs(
    @CurrentUser() user: { userId: string },
    @Query() query: CalendarRangeQueryDto,
    @Res() res: Response,
  ) {
    const ics = await this.calendarService.exportUserIcs(
      user.userId,
      query.from,
      query.to,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="grafik_kalendarz_${query.from}_${query.to}.ics"`,
    );
    res.setHeader('Cache-Control', 'no-cache');

    res.send(ics);
  }

  @Get('feed-token')
  @UseGuards(JwtAuthGuard, PremiumGuard)
  @RequirePlan('starter')
  async getFeedToken(
    @CurrentUser() user: { userId: string },
  ): Promise<{ token: string }> {
    return this.calendarService.getOrCreateFeedToken(user.userId);
  }

  @Post('revoke-feed')
  @UseGuards(JwtAuthGuard)
  async revokeFeed(@CurrentUser() user: { userId: string }) {
    await this.calendarService.revokeFeedToken(user.userId);
    return { success: true };
  }

  @Get('feed/:token.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async getFeed(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const ics = await this.calendarService.exportFeedByToken(token);

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(ics);
  }
}

