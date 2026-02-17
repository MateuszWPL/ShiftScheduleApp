import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { EmailModule } from '../email/email.module';
import { ShiftValidationService } from './shift-validation.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EmailModule, NotificationsModule],
  controllers: [ShiftsController],
  providers: [ShiftsService, ShiftValidationService],
})
export class ShiftsModule {}
