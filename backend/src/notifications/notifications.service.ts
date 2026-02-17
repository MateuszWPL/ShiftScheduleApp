import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, MembershipStatus, Role, AnnouncementPriority } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Get unread + recent notifications for a user */
  async getNotifications(userId: string, limit = 30) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) return [];

    return this.prisma.notification.findMany({
      where: { userId, teamId: membership.teamId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Count unread notifications */
  async getUnreadCount(userId: string): Promise<number> {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) return 0;

    return this.prisma.notification.count({
      where: { userId, teamId: membership.teamId, read: false },
    });
  }

  /** Mark one notification as read */
  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  /** Mark all notifications as read */
  async markAllRead(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) return;

    return this.prisma.notification.updateMany({
      where: { userId, teamId: membership.teamId, read: false },
      data: { read: true },
    });
  }

  // ── Notification creators (fire-and-forget) ──────────────

  /** Notify employee when assigned to a shift */
  async notifyShiftAssigned(
    employeeUserId: string,
    teamId: string,
    roleName: string,
    date: string,
    time: string,
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          userId: employeeUserId,
          teamId,
          type: NotificationType.SHIFT_ASSIGNED,
          title: 'Nowa zmiana',
          message: `Zostałeś przypisany do zmiany: ${roleName} (${date}, ${time}).`,
        },
      });
    } catch (e) {
      this.logger.error('Failed to create notification', e);
    }
  }

  /** Notify all employees when schedule is published */
  async notifySchedulePublished(teamId: string, count: number) {
    try {
      const employees = await this.prisma.teamMembership.findMany({
        where: { teamId, status: MembershipStatus.ACTIVE, role: Role.EMPLOYEE },
        select: { userId: true },
      });

      if (employees.length === 0) return;

      await this.prisma.notification.createMany({
        data: employees.map((e) => ({
          userId: e.userId,
          teamId,
          type: NotificationType.SHIFT_PUBLISHED,
          title: 'Nowy grafik',
          message: `Opublikowano ${count} zmian. Sprawdź swój grafik.`,
        })),
      });
    } catch (e) {
      this.logger.error('Failed to create publish notifications', e);
    }
  }

  /** Notify all employees about a shift on marketplace */
  async notifyShiftOnMarketplace(
    teamId: string,
    excludeUserId: string,
    roleName: string,
    date: string,
    time: string,
  ) {
    try {
      const employees = await this.prisma.teamMembership.findMany({
        where: {
          teamId,
          status: MembershipStatus.ACTIVE,
          role: Role.EMPLOYEE,
          userId: { not: excludeUserId },
        },
        select: { userId: true },
      });

      if (employees.length === 0) return;

      await this.prisma.notification.createMany({
        data: employees.map((e) => ({
          userId: e.userId,
          teamId,
          type: NotificationType.SHIFT_ON_MARKETPLACE,
          title: 'Zmiana na giełdzie',
          message: `Dostępna zmiana: ${roleName} (${date}, ${time}). Przejdź do giełdy, aby ją przejąć.`,
        })),
      });
    } catch (e) {
      this.logger.error('Failed to create marketplace notifications', e);
    }
  }

  /** Notify all team members about a new announcement (1 notification, no spam) */
  async notifyAnnouncement(
    teamId: string,
    excludeAuthorId: string,
    title: string,
    priority: AnnouncementPriority,
  ) {
    try {
      const members = await this.prisma.teamMembership.findMany({
        where: {
          teamId,
          status: MembershipStatus.ACTIVE,
          userId: { not: excludeAuthorId },
        },
        select: { userId: true },
      });

      if (members.length === 0) return;

      const priorityLabel =
        priority === AnnouncementPriority.URGENT
          ? '🔴 Pilne'
          : priority === AnnouncementPriority.IMPORTANT
            ? '🟡 Ważne'
            : '';
      const prefix = priorityLabel ? `${priorityLabel}: ` : '';

      await this.prisma.notification.createMany({
        data: members.map((m) => ({
          userId: m.userId,
          teamId,
          type: NotificationType.ANNOUNCEMENT,
          title: 'Nowe ogłoszenie',
          message: `${prefix}${title}`,
        })),
      });
    } catch (e) {
      this.logger.error('Failed to create announcement notifications', e);
    }
  }

  /** Notify employee when their shift is deleted */
  async notifyShiftDeleted(
    employeeUserId: string,
    teamId: string,
    roleName: string,
    date: string,
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          userId: employeeUserId,
          teamId,
          type: NotificationType.SHIFT_DELETED,
          title: 'Zmiana usunięta',
          message: `Twoja zmiana ${roleName} (${date}) została usunięta.`,
        },
      });
    } catch (e) {
      this.logger.error('Failed to create delete notification', e);
    }
  }
}
