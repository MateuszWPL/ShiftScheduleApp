import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { RequirePlan } from '../auth/decorators/premium.decorator';
import { PremiumGuard } from '../auth/guards/premium.guard';
import { IsDateString, IsOptional } from 'class-validator';

class ReportQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

@Controller('reports')
@UseGuards(PremiumGuard)
@RequirePlan('starter')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Raport godzin pracy per pracownik */
  @Get('hours')
  getHoursReport(
    @CurrentUser() user: { userId: string },
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getHoursReport(user.userId, query.from, query.to);
  }

  /** Raport kosztów wynagrodzeń */
  @Get('costs')
  getCostsReport(
    @CurrentUser() user: { userId: string },
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getCostsReport(user.userId, query.from, query.to);
  }

  /** Raport zgodności z Kodeksem Pracy */
  @Get('compliance')
  getComplianceReport(
    @CurrentUser() user: { userId: string },
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getComplianceReport(user.userId, query.from, query.to);
  }
}
