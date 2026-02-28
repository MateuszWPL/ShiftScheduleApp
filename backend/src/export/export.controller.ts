import { Controller, Get, Query, UseGuards, Header, StreamableFile } from '@nestjs/common';
import { ExportService } from './export.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { RequirePlan } from '../auth/decorators/premium.decorator';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PremiumGuard } from '../auth/guards/premium.guard';
import { IsDateString } from 'class-validator';
import { Readable } from 'stream';

class ExportDateQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

@Controller('export')
@UseGuards(JwtAuthGuard, PremiumGuard)
@RequirePlan('starter')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('schedule-csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportScheduleCsv(
    @CurrentUser() user: { userId: string },
    @Query() query: ExportDateQueryDto,
  ): Promise<StreamableFile> {
    const csv = await this.exportService.exportScheduleCsv(user.userId, query.from, query.to);
    return new StreamableFile(Readable.from(csv), {
      disposition: `attachment; filename="grafik_${query.from}_${query.to}.csv"`,
    });
  }

  @Get('hours-csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportHoursCsv(
    @CurrentUser() user: { userId: string },
    @Query() query: ExportDateQueryDto,
  ): Promise<StreamableFile> {
    const csv = await this.exportService.exportHoursCsv(user.userId, query.from, query.to);
    return new StreamableFile(Readable.from(csv), {
      disposition: `attachment; filename="raport_godzin_${query.from}_${query.to}.csv"`,
    });
  }

  @Get('employees-csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportEmployeesCsv(
    @CurrentUser() user: { userId: string },
  ): Promise<StreamableFile> {
    const csv = await this.exportService.exportEmployeesCsv(user.userId);
    const today = new Date().toISOString().slice(0, 10);
    return new StreamableFile(Readable.from(csv), {
      disposition: `attachment; filename="pracownicy_${today}.csv"`,
    });
  }
}
