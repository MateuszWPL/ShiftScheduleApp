import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @SkipThrottle()
  @Get()
  getAnnouncements(@CurrentUser() user: any) {
    return this.announcementsService.getAnnouncements(user.userId);
  }

  @Post()
  createAnnouncement(
    @CurrentUser() user: any,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.createAnnouncement(user.userId, dto);
  }

  @Delete(':id')
  deleteAnnouncement(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.announcementsService.deleteAnnouncement(user.userId, id);
  }

  @Post(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.announcementsService.markAsRead(user.userId, id);
  }
}
