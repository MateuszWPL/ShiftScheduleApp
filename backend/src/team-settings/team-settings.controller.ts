import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { TeamSettingsService } from './team-settings.service';
import {
  UpdateTeamSettingsDto,
  UpdateTeamNameDto,
} from './dto/update-team-settings.dto';

@Controller('team-settings')
@UseGuards(JwtAuthGuard)
export class TeamSettingsController {
  constructor(private readonly teamSettingsService: TeamSettingsService) {}

  @Get()
  getSettings(@CurrentUser() user: any) {
    return this.teamSettingsService.getSettings(user.userId);
  }

  @Patch()
  updateSettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateTeamSettingsDto,
  ) {
    return this.teamSettingsService.updateSettings(user.userId, dto);
  }

  @Patch('team-name')
  updateTeamName(
    @CurrentUser() user: any,
    @Body() dto: UpdateTeamNameDto,
  ) {
    return this.teamSettingsService.updateTeamName(user.userId, dto);
  }

  @Post('regenerate-invite')
  regenerateInviteCode(@CurrentUser() user: any) {
    return this.teamSettingsService.regenerateInviteCode(user.userId);
  }
}
