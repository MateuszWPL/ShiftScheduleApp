import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, Role } from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Pobierz teamId aktywnego członka */
  private async getTeamId(userId: string): Promise<string> {
    const m = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!m) throw new BadRequestException('Brak aktywnego zespołu.');
    return m.teamId;
  }

  /** Pobierz zmiany i członków dla okresu */
  private async getShiftData(teamId: string, from: Date, to: Date) {
    const [shifts, members] = await Promise.all([
      this.prisma.shift.findMany({
        where: {
          teamId,
          startTime: { lt: to },
          endTime: { gt: from },
        },
        include: {
          assignments: {
            where: { userId: { not: null } },
            include: {
              user: {
                select: { id: true, name: true, nickname: true, hourlyRate: true, maxHours: true },
              },
            },
          },
          position: { select: { name: true, color: true } },
        },
      }),
      this.prisma.teamMembership.findMany({
        where: { teamId, status: MembershipStatus.ACTIVE },
        include: {
          user: {
            select: {
              id: true, name: true, nickname: true,
              hourlyRate: true, maxHours: true,
            },
          },
        },
      }),
    ]);
    return { shifts, members };
  }

  private isAdmin(role: string): boolean {
    return role === 'OWNER' || role === 'MANAGER';
  }

  // ── Raport godzin pracy ─────────────────────────────────────

  async getHoursReport(userId: string, from: string, to: string, callerRole: string = 'OWNER') {
    const teamId = await this.getTeamId(userId);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    let { shifts, members } = await this.getShiftData(teamId, fromDate, toDate);

    if (!this.isAdmin(callerRole)) {
      members = members.filter((m) => m.user.id === userId);
    }

    const hoursMap = new Map<string, { total: number; shifts: number; days: Set<string> }>();
    for (const m of members) {
      hoursMap.set(m.user.id, { total: 0, shifts: 0, days: new Set() });
    }

    for (const shift of shifts) {
      const hrs = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3600000;
      const day = new Date(shift.startTime).toISOString().slice(0, 10);
      for (const a of shift.assignments) {
        if (!a.userId || !hoursMap.has(a.userId)) continue;
        const rec = hoursMap.get(a.userId)!;
        rec.total += hrs;
        rec.shifts += 1;
        rec.days.add(day);
      }
    }

    const employees = members.map((m) => {
      const uid = m.user.id;
      const rec = hoursMap.get(uid) ?? { total: 0, shifts: 0, days: new Set<string>() };
      const totalHours = Math.round(rec.total * 10) / 10;
      const avgHoursPerShift = rec.shifts > 0 ? Math.round((rec.total / rec.shifts) * 10) / 10 : 0;
      return {
        userId: uid,
        name: m.user.nickname || m.user.name,
        totalHours,
        totalShifts: rec.shifts,
        totalDays: rec.days.size,
        avgHoursPerShift,
        maxHours: m.user.maxHours,
        overtime: m.user.maxHours != null && totalHours > m.user.maxHours
          ? Math.round((totalHours - m.user.maxHours) * 10) / 10
          : 0,
      };
    }).sort((a, b) => b.totalHours - a.totalHours);

    const totalTeamHours = Math.round(employees.reduce((s, e) => s + e.totalHours, 0) * 10) / 10;
    const totalTeamShifts = employees.reduce((s, e) => s + e.totalShifts, 0);

    return {
      from, to,
      totalTeamHours,
      totalTeamShifts,
      employeeCount: employees.length,
      employees,
    };
  }

  // ── Raport kosztów wynagrodzeń ──────────────────────────────

  async getCostsReport(userId: string, from: string, to: string) {
    const teamId = await this.getTeamId(userId);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const { shifts, members } = await this.getShiftData(teamId, fromDate, toDate);

    const costsMap = new Map<string, { hours: number; cost: number; shifts: number }>();
    for (const m of members) {
      costsMap.set(m.user.id, { hours: 0, cost: 0, shifts: 0 });
    }

    for (const shift of shifts) {
      const hrs = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3600000;
      for (const a of shift.assignments) {
        if (!a.userId || !a.user) continue;
        const rec = costsMap.get(a.userId) ?? { hours: 0, cost: 0, shifts: 0 };
        const rate = Number(a.user.hourlyRate ?? 0);
        rec.hours += hrs;
        rec.cost += hrs * rate;
        rec.shifts += 1;
        costsMap.set(a.userId, rec);
      }
    }

    const employees = members.map((m) => {
      const uid = m.user.id;
      const rec = costsMap.get(uid) ?? { hours: 0, cost: 0, shifts: 0 };
      return {
        userId: uid,
        name: m.user.nickname || m.user.name,
        hourlyRate: Number(m.user.hourlyRate ?? 0),
        totalHours: Math.round(rec.hours * 10) / 10,
        totalCost: Math.round(rec.cost * 100) / 100,
        totalShifts: rec.shifts,
      };
    }).sort((a, b) => b.totalCost - a.totalCost);

    const totalCost = Math.round(employees.reduce((s, e) => s + e.totalCost, 0) * 100) / 100;
    const totalHours = Math.round(employees.reduce((s, e) => s + e.totalHours, 0) * 10) / 10;

    return {
      from, to,
      totalCost,
      totalHours,
      employeeCount: employees.length,
      employees,
    };
  }

  // ── Raport zgodności z Kodeksem Pracy ───────────────────────

  async getComplianceReport(userId: string, from: string, to: string, callerRole: string = 'OWNER') {
    const teamId = await this.getTeamId(userId);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    let { shifts, members } = await this.getShiftData(teamId, fromDate, toDate);

    if (!this.isAdmin(callerRole)) {
      members = members.filter((m) => m.user.id === userId);
    }

    // Buduj listę zmian per pracownik
    const shiftsMap = new Map<string, { start: Date; end: Date; roleName: string }[]>();
    for (const m of members) {
      shiftsMap.set(m.user.id, []);
    }

    for (const shift of shifts) {
      for (const a of shift.assignments) {
        if (!a.userId) continue;
        const list = shiftsMap.get(a.userId) ?? [];
        list.push({
          start: new Date(shift.startTime),
          end: new Date(shift.endTime),
          roleName: shift.roleName,
        });
        shiftsMap.set(a.userId, list);
      }
    }

    type Violation = { type: string; description: string; date?: string };

    const employees = members.map((m) => {
      const uid = m.user.id;
      const userShifts = (shiftsMap.get(uid) ?? []).sort((a, b) => a.start.getTime() - b.start.getTime());
      const violations: Violation[] = [];
      let totalHours = 0;

      // Sprawdź 11h odpoczynku między zmianami (doba pracownicza)
      for (let i = 1; i < userShifts.length; i++) {
        const prevEnd = userShifts[i - 1].end;
        const currStart = userShifts[i].start;
        const gapHrs = (currStart.getTime() - prevEnd.getTime()) / 3600000;
        if (gapHrs < 11 && gapHrs >= 0) {
          violations.push({
            type: 'REST_11H',
            description: `Przerwa ${Math.round(gapHrs * 10) / 10}h zamiast min. 11h`,
            date: currStart.toISOString().slice(0, 10),
          });
        }
      }

      // Sumuj godziny
      for (const s of userShifts) {
        totalHours += (s.end.getTime() - s.start.getTime()) / 3600000;
      }

      // Sprawdź tygodniowy limit 48h (dla każdego pełnego tygodnia w okresie)
      const weeklyHours = new Map<string, number>();
      for (const s of userShifts) {
        const d = new Date(s.start);
        const wk = getISOWeek(d);
        const hrs = (s.end.getTime() - s.start.getTime()) / 3600000;
        weeklyHours.set(wk, (weeklyHours.get(wk) ?? 0) + hrs);
      }
      for (const [week, hrs] of weeklyHours) {
        if (hrs > 48) {
          violations.push({
            type: 'WEEKLY_48H',
            description: `${Math.round(hrs * 10) / 10}h w tyg. ${week} (limit 48h)`,
          });
        }
      }

      // Sprawdź maxHours użytkownika
      const maxH = m.user.maxHours;
      if (maxH != null && totalHours > maxH) {
        violations.push({
          type: 'MAX_HOURS',
          description: `${Math.round(totalHours * 10) / 10}h / limit ${maxH}h`,
        });
      }

      return {
        userId: uid,
        name: m.user.nickname || m.user.name,
        totalHours: Math.round(totalHours * 10) / 10,
        totalShifts: userShifts.length,
        violations,
        isCompliant: violations.length === 0,
      };
    });

    const totalViolations = employees.reduce((s, e) => s + e.violations.length, 0);
    const compliantCount = employees.filter((e) => e.isCompliant).length;

    return {
      from, to,
      employeeCount: employees.length,
      compliantCount,
      totalViolations,
      employees,
    };
  }
}

/** ISO week number (YYYY-WXX) */
function getISOWeek(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
