import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import {
  MembershipStatus,
  Role,
  AnnouncementPriority,
} from '@prisma/client';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  /** Get active announcements for user's team */
  async getAnnouncements(userId: string) {
    const membership = await this.getActiveMembership(userId);
    if (!membership) return [];

    const now = new Date();

    const announcements = await this.prisma.announcement.findMany({
      where: {
        teamId: membership.teamId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
        reads: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    return announcements.map((a) => ({
      id: a.id,
      teamId: a.teamId,
      title: a.title,
      content: a.content,
      priority: a.priority,
      expiresAt: a.expiresAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      author: a.author,
      isRead: a.reads.length > 0,
    }));
  }

  /** Create a new announcement (OWNER/MANAGER only) */
  async createAnnouncement(userId: string, dto: CreateAnnouncementDto) {
    const membership = await this.getActiveMembership(userId);
    if (!membership) throw new ForbiddenException('Brak aktywnego zespołu');

    if (
      membership.role !== Role.OWNER &&
      membership.role !== Role.MANAGER
    ) {
      throw new ForbiddenException(
        'Tylko właściciel lub menedżer może tworzyć ogłoszenia',
      );
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        teamId: membership.teamId,
        authorId: userId,
        title: dto.title,
        content: dto.content,
        priority: dto.priority ?? AnnouncementPriority.NORMAL,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
      },
    });

    // Fire-and-forget: send 1 notification to all team members (excluding author)
    const effectivePriority = dto.priority ?? AnnouncementPriority.NORMAL;
    this.notifications
      .notifyAnnouncement(
        membership.teamId,
        userId,
        dto.title,
        effectivePriority,
      )
      .catch(() => {});

    // Send email only for URGENT announcements (respects settings)
    if (effectivePriority === AnnouncementPriority.URGENT) {
      this.sendUrgentAnnouncementEmails(
        membership.teamId,
        userId,
        dto.title,
        dto.content,
        announcement.author.name,
      ).catch(() => {});
    }

    this.logger.log(
      `Announcement "${dto.title}" created by ${userId} in team ${membership.teamId}`,
    );

    return {
      id: announcement.id,
      teamId: announcement.teamId,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      expiresAt: announcement.expiresAt?.toISOString() ?? null,
      createdAt: announcement.createdAt.toISOString(),
      author: announcement.author,
      isRead: false,
    };
  }

  /** Delete an announcement (OWNER/MANAGER only, must be from same team) */
  async deleteAnnouncement(userId: string, announcementId: string) {
    const membership = await this.getActiveMembership(userId);
    if (!membership) throw new ForbiddenException('Brak aktywnego zespołu');

    if (
      membership.role !== Role.OWNER &&
      membership.role !== Role.MANAGER
    ) {
      throw new ForbiddenException(
        'Tylko właściciel lub menedżer może usuwać ogłoszenia',
      );
    }

    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement)
      throw new NotFoundException('Ogłoszenie nie znalezione');
    if (announcement.teamId !== membership.teamId)
      throw new ForbiddenException('Brak dostępu do tego ogłoszenia');

    await this.prisma.announcement.delete({
      where: { id: announcementId },
    });

    return { success: true };
  }

  /** Mark an announcement as read by user */
  async markAsRead(userId: string, announcementId: string) {
    const membership = await this.getActiveMembership(userId);
    if (!membership) throw new ForbiddenException('Brak aktywnego zespołu');

    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement)
      throw new NotFoundException('Ogłoszenie nie znalezione');
    if (announcement.teamId !== membership.teamId)
      throw new ForbiddenException('Brak dostępu do tego ogłoszenia');

    await this.prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      create: { announcementId, userId },
      update: {},
    });

    return { success: true };
  }

  /** Send urgent announcement email to all team members */
  private async sendUrgentAnnouncementEmails(
    teamId: string,
    excludeAuthorId: string,
    title: string,
    content: string,
    authorName: string,
  ) {
    try {
      const settings = await this.prisma.teamSettings.findUnique({ where: { teamId } });
      if (settings && !settings.notifyAnnouncements) return;

      const members = await this.prisma.teamMembership.findMany({
        where: {
          teamId,
          status: MembershipStatus.ACTIVE,
          userId: { not: excludeAuthorId },
        },
        include: {
          user: { select: { email: true, name: true } },
        },
      });

      for (const m of members) {
        if (!m.user.email) continue;
        this.emailService
          .sendUrgentAnnouncementEmail(
            m.user.email,
            m.user.name,
            title,
            content,
            authorName,
          )
          .catch(() => {});
      }
    } catch (e) {
      this.logger.error('Failed to send urgent announcement emails', e);
    }
  }

  private async getActiveMembership(userId: string) {
    return this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
  }
}
