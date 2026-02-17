import { Module } from '@nestjs/common';
import { TeamSettingsService } from './team-settings.service';
import { TeamSettingsController } from './team-settings.controller';

@Module({
  controllers: [TeamSettingsController],
  providers: [TeamSettingsService],
  exports: [TeamSettingsService],
})
export class TeamSettingsModule {}
