import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, ShiftStatus } from '@prisma/client';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getTeamId(userId: string): Promise<string> {
    const m = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!m) throw new BadRequestException('Brak aktywnego zespołu.');
    return m.teamId;
  }

  /** BOM + separator hint for Excel */
  private csvHeader(): string {
    return '\uFEFF';
  }

  private escapeCsv(val: string | number | null | undefined): string {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /** Format liczby tak, aby Excel nie interpretował jej jako daty (np. 12.5 -> "12.maj"). Prefix apostrofu wymusza tekst. */
  private excelSafeNumber(val: number | null | undefined): string {
    if (val == null) return '';
    return `'${String(val)}`;
  }

  private toCsvRow(values: (string | number | null | undefined)[]): string {
    return values.map((v) => this.escapeCsv(v)).join(';');
  }

  private isAdmin(role: string): boolean {
    return role === 'ADMIN';
  }

  // ── Eksport grafiku do CSV ───────────────────────────────────

  async exportScheduleCsv(userId: string, from: string, to: string, callerRole: string = 'ADMIN'): Promise<string> {
    const teamId = await this.getTeamId(userId);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const onlyMine = !this.isAdmin(callerRole);

    const shifts = await this.prisma.shift.findMany({
      where: {
        teamId,
        startTime: { gte: fromDate, lt: toDate },
        status: { in: [ShiftStatus.PUBLISHED, ShiftStatus.COMPLETED] },
        ...(onlyMine ? { assignments: { some: { userId } } } : {}),
      },
      include: {
        assignments: {
          ...(onlyMine ? { where: { userId } } : {}),
          include: {
            user: { select: { name: true, nickname: true, email: true } },
          },
        },
        position: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    const headerCols = onlyMine
      ? ['Data', 'Dzień', 'Godzina rozpoczęcia', 'Godzina zakończenia', 'Czas trwania (h)', 'Stanowisko', 'Status']
      : ['Data', 'Dzień', 'Godzina rozpoczęcia', 'Godzina zakończenia', 'Czas trwania (h)', 'Stanowisko', 'Pracownik', 'Email', 'Status'];

    const header = this.toCsvRow(headerCols);
    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

    const rows = shifts.flatMap((shift) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      const hrs = Math.round((end.getTime() - start.getTime()) / 3600000 * 10) / 10;
      const date = start.toLocaleDateString('pl-PL');
      const dayName = dayNames[start.getDay()];
      const startTime = start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      const endTime = end.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      const position = shift.position?.name || shift.roleName;

      if (onlyMine) {
        return [this.toCsvRow([date, dayName, startTime, endTime, hrs, position, shift.status])];
      }

      if (shift.assignments.length === 0) {
        return [this.toCsvRow([date, dayName, startTime, endTime, hrs, position, 'Brak przypisania', '', shift.status])];
      }

      return shift.assignments.map((a) => {
        const name = a.user ? (a.user.nickname || a.user.name) : (a.isUpForGrabs ? 'Giełda' : 'Brak');
        const email = a.user?.email ?? '';
        return this.toCsvRow([date, dayName, startTime, endTime, hrs, position, name, email, shift.status]);
      });
    });

    return this.csvHeader() + header + '\n' + rows.join('\n');
  }

  // ── Eksport raportu godzin do CSV ────────────────────────────

  async exportHoursCsv(userId: string, from: string, to: string, callerRole: string = 'ADMIN'): Promise<string> {
    const teamId = await this.getTeamId(userId);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const onlyMine = !this.isAdmin(callerRole);

    const [shifts, allMembers] = await Promise.all([
      this.prisma.shift.findMany({
        where: {
          teamId,
          startTime: { lt: toDate },
          endTime: { gt: fromDate },
        },
        include: {
          assignments: {
            where: { userId: { not: null } },
            include: {
              user: { select: { id: true, name: true, nickname: true, email: true, hourlyRate: true, maxHours: true } },
            },
          },
        },
      }),
      this.prisma.teamMembership.findMany({
        where: { teamId, status: MembershipStatus.ACTIVE },
        include: {
          user: { select: { id: true, name: true, nickname: true, email: true, hourlyRate: true, maxHours: true } },
        },
      }),
    ]);

    const members = onlyMine
      ? allMembers.filter((m) => m.user.id === userId)
      : allMembers;

    const hoursMap = new Map<string, { hours: number; shifts: number; cost: number }>();
    for (const m of members) {
      hoursMap.set(m.user.id, { hours: 0, shifts: 0, cost: 0 });
    }
    for (const shift of shifts) {
      const hrs = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3600000;
      for (const a of shift.assignments) {
        if (!a.userId || !a.user || !hoursMap.has(a.userId)) continue;
        const rec = hoursMap.get(a.userId)!;
        const rate = Number(a.user.hourlyRate ?? 0);
        rec.hours += hrs;
        rec.shifts += 1;
        rec.cost += hrs * rate;
      }
    }

    if (onlyMine) {
      const header = this.toCsvRow(['Pracownik', 'Godziny', 'Zmiany', 'Max godzin', 'Nadgodziny']);

      const rows = members.map((m) => {
        const rec = hoursMap.get(m.user.id) ?? { hours: 0, shifts: 0, cost: 0 };
        const totalHours = Math.round(rec.hours * 10) / 10;
        const maxH = m.user.maxHours;
        const overtime = maxH != null && totalHours > maxH
          ? Math.round((totalHours - maxH) * 10) / 10
          : 0;
        return this.toCsvRow([
          m.user.nickname || m.user.name,
          this.excelSafeNumber(totalHours),
          rec.shifts,
          maxH ?? '',
          this.excelSafeNumber(overtime),
        ]);
      });

      return this.csvHeader() + header + '\n' + rows.join('\n');
    }

    const header = this.toCsvRow([
      'Pracownik', 'Email', 'Stawka (zł/h)', 'Godziny', 'Zmiany',
      'Koszt (zł)', 'Max godzin', 'Nadgodziny',
    ]);

    const rows = members.map((m) => {
      const rec = hoursMap.get(m.user.id) ?? { hours: 0, shifts: 0, cost: 0 };
      const totalHours = Math.round(rec.hours * 10) / 10;
      const totalCost = Math.round(rec.cost * 100) / 100;
      const rate = Number(m.user.hourlyRate ?? 0);
      const maxH = m.user.maxHours;
      const overtime = maxH != null && totalHours > maxH
        ? Math.round((totalHours - maxH) * 10) / 10
        : 0;
      return this.toCsvRow([
        m.user.nickname || m.user.name,
        m.user.email,
        this.excelSafeNumber(rate),
        this.excelSafeNumber(totalHours),
        rec.shifts,
        this.excelSafeNumber(totalCost),
        maxH ?? '',
        this.excelSafeNumber(overtime),
      ]);
    });

    return this.csvHeader() + header + '\n' + rows.join('\n');
  }

  // ── Eksport listy pracowników do CSV ─────────────────────────

  async exportEmployeesCsv(userId: string): Promise<string> {
    const teamId = await this.getTeamId(userId);

    const members = await this.prisma.teamMembership.findMany({
      where: { teamId, status: MembershipStatus.ACTIVE },
      include: {
        user: {
          select: {
            name: true, nickname: true, email: true,
            hourlyRate: true, maxHours: true,
          },
        },
      },
      orderBy: { role: 'asc' },
    });

    const header = this.toCsvRow([
      'Imię i nazwisko', 'Pseudonim', 'Email',
      'Rola', 'Stawka (zł/h)', 'Max godzin/okres',
    ]);

    const roleLabels: Record<string, string> = {
      ADMIN: 'Administrator',
      EMPLOYEE: 'Pracownik',
    };

    const rows = members.map((m) =>
      this.toCsvRow([
        m.user.name,
        m.user.nickname ?? '',
        m.user.email,
        roleLabels[m.role] ?? m.role,
        this.excelSafeNumber(Number(m.user.hourlyRate ?? 0)),
        m.user.maxHours ?? '',
      ]),
    );

    return this.csvHeader() + header + '\n' + rows.join('\n');
  }
}
