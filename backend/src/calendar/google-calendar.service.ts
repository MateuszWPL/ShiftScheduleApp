import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, ShiftStatus } from '@prisma/client';
import { google, calendar_v3 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const TZ = 'Europe/Warsaw';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getOAuth2Client() {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl && process.env.NODE_ENV === 'production') {
      throw new Error('FRONTEND_URL must be set in production');
    }
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
      `${frontendUrl || 'http://localhost:3000'}/app/calendar-callback`;

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Integracja z Google Calendar nie jest skonfigurowana. Brak GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET.',
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  getAuthUrl(userId: string): string {
    const oauth2 = this.getOAuth2Client();
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: userId,
    });
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    const oauth2 = this.getOAuth2Client();
    const { tokens } = await oauth2.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new BadRequestException(
        'Nie udało się uzyskać tokenów z Google. Spróbuj ponownie.',
      );
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    await this.prisma.googleCalendarToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
    });
  }

  async isConnected(userId: string): Promise<boolean> {
    const token = await this.prisma.googleCalendarToken.findUnique({
      where: { userId },
    });
    return !!token;
  }

  async disconnect(userId: string): Promise<void> {
    const token = await this.prisma.googleCalendarToken.findUnique({
      where: { userId },
    });
    if (!token) return;

    try {
      const oauth2 = this.getOAuth2Client();
      oauth2.setCredentials({ access_token: token.accessToken });
      await oauth2.revokeToken(token.accessToken);
    } catch {
      this.logger.warn(`Nie udało się odwołać tokenu Google dla userId=${userId}`);
    }

    await this.prisma.googleCalendarToken.delete({ where: { userId } });
  }

  private async getAuthedCalendar(userId: string): Promise<calendar_v3.Calendar> {
    const tokenRecord = await this.prisma.googleCalendarToken.findUnique({
      where: { userId },
    });

    if (!tokenRecord) {
      throw new ForbiddenException(
        'Nie połączono z Google Calendar. Kliknij „Połącz z Google Calendar".',
      );
    }

    const oauth2 = this.getOAuth2Client();
    oauth2.setCredentials({
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
    });

    oauth2.on('tokens', async (newTokens) => {
      const updateData: { accessToken?: string; expiresAt?: Date } = {};
      if (newTokens.access_token) {
        updateData.accessToken = newTokens.access_token;
      }
      if (newTokens.expiry_date) {
        updateData.expiresAt = new Date(newTokens.expiry_date);
      }
      if (Object.keys(updateData).length > 0) {
        await this.prisma.googleCalendarToken.update({
          where: { userId },
          data: updateData,
        });
      }
    });

    return google.calendar({ version: 'v3', auth: oauth2 });
  }

  async syncShifts(
    userId: string,
    fromIso: string,
    toIso: string,
  ): Promise<{ created: number; updated: number; total: number }> {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
      throw new BadRequestException('Nieprawidłowy zakres dat.');
    }

    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
      include: { team: true },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego zespołu.');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { teamId: membership.teamId },
    });
    if ((subscription?.planId ?? 'free') === 'free') {
      throw new ForbiddenException(
        'Integracja z kalendarzem jest dostępna od planu Starter+.',
      );
    }

    const shifts = await this.prisma.shift.findMany({
      where: {
        teamId: membership.teamId,
        startTime: { lt: to },
        endTime: { gt: from },
        status: { in: [ShiftStatus.PUBLISHED, ShiftStatus.COMPLETED] },
        assignments: { some: { userId } },
      },
      include: {
        assignments: { where: { userId } },
        position: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const calendar = await this.getAuthedCalendar(userId);
    const tokenRecord = await this.prisma.googleCalendarToken.findUnique({
      where: { userId },
    });
    const calendarId = tokenRecord?.calendarId || 'primary';

    let existingEvents: calendar_v3.Schema$Event[] = [];
    try {
      const list = await calendar.events.list({
        calendarId,
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        maxResults: 2500,
        singleEvents: true,
        q: 'Staffer',
      });
      existingEvents = list.data.items || [];
    } catch {
      this.logger.warn('Nie udało się pobrać istniejących eventów.');
    }

    const existingByExtId = new Map<string, calendar_v3.Schema$Event>();
    for (const ev of existingEvents) {
      const extId = ev.extendedProperties?.private?.stafferShiftId;
      if (extId) {
        existingByExtId.set(extId, ev);
      }
    }

    let created = 0;
    let updated = 0;

    for (const shift of shifts) {
      const assignmentId = shift.assignments[0]?.id ?? shift.id;
      const stafferShiftId = `staffer-${shift.id}-${assignmentId}`;
      const positionName = shift.position?.name || shift.roleName;
      const hrs = Math.round(
        ((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3600000) * 10,
      ) / 10;

      const eventBody: calendar_v3.Schema$Event = {
        summary: `🗓️ Zmiana: ${positionName}`,
        description: `Zmiana w zespole ${membership.team.name} (${positionName}), czas trwania: ${hrs}h.\n\nDodano automatycznie przez Staffer.`,
        start: {
          dateTime: new Date(shift.startTime).toISOString(),
          timeZone: TZ,
        },
        end: {
          dateTime: new Date(shift.endTime).toISOString(),
          timeZone: TZ,
        },
        extendedProperties: {
          private: {
            stafferShiftId,
            source: 'staffer',
          },
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 60 }],
        },
      };

      const existing = existingByExtId.get(stafferShiftId);

      try {
        if (existing?.id) {
          await calendar.events.update({
            calendarId,
            eventId: existing.id,
            requestBody: eventBody,
          });
          updated++;
        } else {
          await calendar.events.insert({
            calendarId,
            requestBody: eventBody,
          });
          created++;
        }
      } catch (err) {
        this.logger.error(
          `Błąd syncu shiftu ${shift.id}: ${(err as Error).message}`,
        );
      }
    }

    await this.prisma.googleCalendarToken.update({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    });

    return { created, updated, total: shifts.length };
  }

  async getStatus(userId: string): Promise<{
    connected: boolean;
    lastSyncedAt: string | null;
    email: string | null;
  }> {
    const token = await this.prisma.googleCalendarToken.findUnique({
      where: { userId },
    });

    if (!token) {
      return { connected: false, lastSyncedAt: null, email: null };
    }

    let email: string | null = null;
    try {
      const oauth2 = this.getOAuth2Client();
      oauth2.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
      });
      const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
      const userInfo = await oauth2Api.userinfo.get();
      email = userInfo.data.email || null;
    } catch {
      // Token may be expired but still valid via refresh
    }

    return {
      connected: true,
      lastSyncedAt: token.lastSyncedAt?.toISOString() || null,
      email,
    };
  }
}
