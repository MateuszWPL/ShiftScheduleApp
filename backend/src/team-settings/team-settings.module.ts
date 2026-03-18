import { Module } from '@nestjs/common';
import { TeamSettingsService } from './team-settings.service';
import { TeamSettingsController } from './team-settings.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [TeamSettingsController],
  providers: [TeamSettingsService],
  exports: [TeamSettingsService],
})
export class TeamSettingsModule {}
