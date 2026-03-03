import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, ShiftStatus } from '@prisma/client';
import * as crypto from 'crypto';

/** Format date in Europe/Warsaw local time for iCal (fixes 1h shift in calendar apps) */
const TZ = 'Europe/Warsaw';

function formatDateInTz(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}${get('month')}${get('day')}T${get('hour')}${get('minute')}${get('second')}`;
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private async getActiveMembership(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
      include: { team: true },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego zespołu.');
    }
    return membership;
  }

  private async ensureStarterOrHigher(teamId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { teamId },
    });

    const planId = subscription?.planId ?? 'free';
    if (planId === 'free') {
      throw new ForbiddenException(
        'Integracja z kalendarzem jest dostępna od planu Starter+.',
      );
    }
  }

  private buildIcs(
    events: {
      uid: string;
      start: Date;
      end: Date;
      summary: string;
      description?: string;
    }[],
    prodIdSuffix: string,
  ): string {
    const lines: string[] = [];
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Staffer//Grafik zmian ' + prodIdSuffix + '//PL');
    lines.push('CALSCALE:GREGORIAN');

    for (const e of events) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${e.uid}`);
      lines.push(`DTSTART;TZID=${TZ}:${formatDateInTz(e.start)}`);
      lines.push(`DTEND;TZID=${TZ}:${formatDateInTz(e.end)}`);
      lines.push(`SUMMARY:${e.summary}`);
      if (e.description) {
        lines.push(`DESCRIPTION:${e.description.replace(/\r?\n/g, '\\n')}`);
      }
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private async getUserAssignedShiftsInRange(
    userId: string,
    from: Date,
    to: Date,
  ) {
    const membership = await this.getActiveMembership(userId);

    const shifts = await this.prisma.shift.findMany({
      where: {
        teamId: membership.teamId,
        startTime: { lt: to },
        endTime: { gt: from },
        status: { in: [ShiftStatus.PUBLISHED, ShiftStatus.COMPLETED] },
        assignments: {
          some: { userId },
        },
      },
      include: {
        assignments: {
          where: { userId },
        },
        position: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return shifts;
  }

  async exportUserIcs(userId: string, fromIso: string, toIso: string): Promise<string> {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
      throw new BadRequestException('Nieprawidłowy zakres dat.');
    }

    const membership = await this.getActiveMembership(userId);
    await this.ensureStarterOrHigher(membership.teamId);

    const shifts = await this.getUserAssignedShiftsInRange(userId, from, to);

    const events = shifts.map((shift) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      const positionName = shift.position?.name || shift.roleName;
      const summary = `Zmiana: ${positionName}`;
      const hrs =
        Math.round(
          ((end.getTime() - start.getTime()) / 3600000) * 10,
        ) / 10;

      const description = `Zmiana w zespole ${membership.team.name} (${positionName}), czas trwania: ${hrs}h.`;

      const assignmentId =
        shift.assignments[0]?.id ?? shift.id;

      return {
        uid: `staffer-${shift.id}-${assignmentId}@staffer.pl`,
        start,
        end,
        summary,
        description,
      };
    });

    return this.buildIcs(events, 'Export');
  }

  async getOrCreateFeedToken(userId: string): Promise<{ token: string }> {
    const membership = await this.getActiveMembership(userId);
    await this.ensureStarterOrHigher(membership.teamId);

    const existing = await this.prisma.calendarFeed.findUnique({
      where: { userId },
    });
    if (existing) return { token: existing.token };

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.calendarFeed.create({
      data: {
        userId,
        token,
      },
    });
    return { token };
  }

  async revokeFeedToken(userId: string): Promise<void> {
    const existing = await this.prisma.calendarFeed.findUnique({
      where: { userId },
    });
    if (!existing) return;

    await this.prisma.calendarFeed.delete({
      where: { userId },
    });
  }

  async exportFeedByToken(token: string): Promise<string> {
    if (!token) {
      throw new BadRequestException('Brak tokenu kalendarza.');
    }

    const feed = await this.prisma.calendarFeed.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!feed) {
      throw new ForbiddenException('Nieprawidłowy link kalendarza.');
    }

    const membership = await this.getActiveMembership(feed.userId);
    await this.ensureStarterOrHigher(membership.teamId);

    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    const to = new Date(now);
    to.setDate(to.getDate() + 90);

    const shifts = await this.getUserAssignedShiftsInRange(
      feed.userId,
      from,
      to,
    );

    const events = shifts.map((shift) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      const positionName = shift.position?.name || shift.roleName;
      const summary = `Zmiana: ${positionName}`;

      const assignmentId =
        shift.assignments[0]?.id ?? shift.id;

      return {
        uid: `staffer-${shift.id}-${assignmentId}@staffer.pl`,
        start,
        end,
        summary,
      };
    });

    return this.buildIcs(events, 'Feed');
  }
}

