import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { RequirePlan } from '../auth/decorators/premium.decorator';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PremiumGuard } from '../auth/guards/premium.guard';
import { IsDateString } from 'class-validator';

class ReportQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

@Controller('reports')
@UseGuards(JwtAuthGuard, PremiumGuard)
@RequirePlan('starter')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('hours')
  getHoursReport(
    @CurrentUser() user: { userId: string; role: string },
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getHoursReport(user.userId, query.from, query.to, user.role);
  }

  @Get('costs')
  getCostsReport(
    @CurrentUser() user: { userId: string; role: string },
    @Query() query: ReportQueryDto,
  ) {
    if (user.role === 'EMPLOYEE') {
      throw new ForbiddenException('Raport kosztów jest dostępny tylko dla Administratora.');
    }
    return this.reportsService.getCostsReport(user.userId, query.from, query.to);
  }

  @Get('compliance')
  getComplianceReport(
    @CurrentUser() user: { userId: string; role: string },
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getComplianceReport(user.userId, query.from, query.to, user.role);
  }
}
