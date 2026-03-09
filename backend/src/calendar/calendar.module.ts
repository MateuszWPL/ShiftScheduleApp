import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CalendarService } from './calendar.service';
import { GoogleCalendarService } from './google-calendar.service';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CalendarController],
  providers: [CalendarService, GoogleCalendarService],
})
export class CalendarModule {}

