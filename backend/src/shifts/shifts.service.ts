import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ShiftValidationService } from './shift-validation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MembershipStatus, Role, ShiftStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { DEFAULT_USER_NAME, DEFAULT_USER_NICKNAME } from '../constants/user-defaults';

function formatShiftDate(d: Date): string {
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatShiftTime(start: Date, end: Date): string {
  const fmt = (d: Date) => d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  return `${fmt(start)}–${fmt(end)}`;
}

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly shiftValidation: ShiftValidationService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Lista zmian zespołu (grafik). Opcjonalny filtr dat from/to. 
   *  Pracownicy widzą tylko PUBLISHED/COMPLETED. Manager/Owner widzi też DRAFT.
   */
  async findAll(
    userId: string,
    query?: { from?: string; to?: string },
  ) {
    const activeMembership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });

    if (!activeMembership) {
      return [];
    }

    const isManager = activeMembership.role === Role.OWNER || activeMembership.role === Role.MANAGER;

    const where: Record<string, any> = {
      teamId: activeMembership.teamId,
    };

    // Employees only see published/completed shifts (not drafts)
    if (!isManager) {
      where.status = { in: [ShiftStatus.PUBLISHED, ShiftStatus.COMPLETED] };
    }

    // Zakres dat: zmiany zachodzące w [from, to] (start przed końcem okresu, koniec po początku)
    if (query?.from) {
      where.endTime = { gte: new Date(query.from) };
    }
    if (query?.to) {
      where.startTime = { ...where.startTime, lte: new Date(query.to) };
    }

    return this.prisma.shift.findMany({
      where,
      include: {
        position: true,
        assignments: {
          include: { user: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /** Podsumowanie okresu: godziny per pracownik, ostrzeżenia (maxHours, brak dostępności) */
  async getSummary(userId: string, from: string, to: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego zespołu.');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [shifts, members, availabilitySlots] = await Promise.all([
      this.prisma.shift.findMany({
        where: {
          teamId: membership.teamId,
          startTime: { lt: toDate },
          endTime: { gt: fromDate },
        },
        include: {
          assignments: {
            where: { userId: { not: null } },
            include: { user: { select: { id: true, name: true, nickname: true } } },
          },
        },
      }),
      this.prisma.teamMembership.findMany({
        where: { teamId: membership.teamId, status: MembershipStatus.ACTIVE, role: Role.EMPLOYEE },
        include: { user: { select: { id: true, name: true, nickname: true, maxHours: true } } },
      }),
      this.prisma.availabilitySlot.findMany({
        where: {
          teamId: membership.teamId,
          startDateTime: { lt: toDate },
          endDateTime: { gt: fromDate },
        },
      }),
    ]);

    const employeeHours = new Map<string, number>();
    const employeeShifts = new Map<string, { shiftId: string; start: Date; end: Date; roleName: string }[]>();
    const employeeMaxHours = new Map<string, number | null>();

    for (const m of members) {
      employeeHours.set(m.user.id, 0);
      employeeShifts.set(m.user.id, []);
      employeeMaxHours.set(m.user.id, m.user.maxHours);
    }

    for (const shift of shifts) {
      for (const a of shift.assignments) {
        if (!a.userId) continue;
        const hrs = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3600000;
        employeeHours.set(a.userId, (employeeHours.get(a.userId) ?? 0) + hrs);
        const list = employeeShifts.get(a.userId) ?? [];
        list.push({
          shiftId: shift.id,
          start: new Date(shift.startTime),
          end: new Date(shift.endTime),
          roleName: shift.roleName,
        });
        employeeShifts.set(a.userId, list);
      }
    }

    const availabilityByUser = new Map<string, { start: Date; end: Date }[]>();
    for (const slot of availabilitySlots) {
      const list = availabilityByUser.get(slot.userId) ?? [];
      list.push({ start: new Date(slot.startDateTime), end: new Date(slot.endDateTime) });
      availabilityByUser.set(slot.userId, list);
    }

    const overlaps = (slotStart: Date, slotEnd: Date, shiftStart: Date, shiftEnd: Date) =>
      slotStart.getTime() < shiftEnd.getTime() && slotEnd.getTime() > shiftStart.getTime();

    const employees = members.map((m) => {
      const uid = m.user.id;
      const hours = Math.round((employeeHours.get(uid) ?? 0) * 10) / 10;
      const maxH = employeeMaxHours.get(uid) ?? null;
      const shiftsList = employeeShifts.get(uid) ?? [];
      const slots = availabilityByUser.get(uid) ?? [];
      const warnings: string[] = [];

      if (maxH != null && hours > maxH) {
        warnings.push(`Przekroczono limit ${maxH}h (masz ${hours}h)`);
      }
      for (const s of shiftsList) {
        const hasOverlap = slots.some((sl) => overlaps(sl.start, sl.end, s.start, s.end));
        if (!hasOverlap) {
          warnings.push(`Brak dostępności: ${s.roleName} ${s.start.toLocaleDateString('pl-PL')}`);
        }
      }

      return {
        userId: uid,
        name: m.user.nickname || m.user.name,
        hours,
        maxHours: maxH,
        warnings,
      };
    });

    return {
      from,
      to,
      employees,
    };
  }

  /** Jedna zmiana z przypisaniami (np. do edycji). */
  async findOne(userId: string, shiftId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, teamId: membership.teamId },
      include: {
        assignments: { include: { user: true } },
      },
    });
    if (!shift) {
      throw new NotFoundException('Zmiana nie istnieje.');
    }
    return shift;
  }

  /** Aktualizacja zmiany (godziny, rola, status) – Owner/Manager. */
  async updateShift(
    requesterId: string,
    shiftId: string,
    data: { startTime?: Date; endTime?: Date; roleName?: string; positionId?: string; status?: ShiftStatus },
  ) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner/Manager może edytować zmiany.');
    }
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, teamId: membership.teamId },
    });
    if (!shift) {
      throw new NotFoundException('Zmiana nie istnieje.');
    }
    const updateData: Record<string, any> = {};
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.status !== undefined) updateData.status = data.status;

    if (data.positionId !== undefined) {
      if (data.positionId) {
        const position = await this.prisma.position.findFirst({
          where: { id: data.positionId, teamId: membership.teamId },
        });
        if (!position) throw new BadRequestException('Stanowisko nie istnieje.');
        updateData.positionId = position.id;
        updateData.roleName = position.name;
      } else {
        updateData.positionId = null;
        if (data.roleName) updateData.roleName = data.roleName;
      }
    } else if (data.roleName !== undefined) {
      updateData.roleName = data.roleName;
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: updateData,
      include: { position: true, assignments: { include: { user: true } } },
    });
  }

  /** Usunięcie zmiany (Owner/Manager). */
  async deleteShift(requesterId: string, shiftId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner/Manager może usuwać zmiany.');
    }

    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, teamId: membership.teamId },
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!shift) {
      throw new NotFoundException('Zmiana nie istnieje.');
    }

    // Notify assigned employees (fire-and-forget, only for published shifts)
    if (shift.status === ShiftStatus.PUBLISHED) {
      for (const a of shift.assignments) {
        if (a.userId) {
          this.notifications
            .notifyShiftDeleted(a.userId, membership.teamId, shift.roleName, formatShiftDate(shift.startTime))
            .catch(() => {});
        }
      }
    }

    await this.prisma.shift.delete({ where: { id: shiftId } });

    this.logger.log(`Shift ${shiftId} deleted by user ${requesterId}`);
    return { success: true };
  }

  /** Tworzenie zmiany (bez przypisań). Przypisania dodaje się przez addAssignment. */
  async create(
    userId: string,
    data: { startTime: Date; endTime: Date; roleName?: string; positionId?: string; status?: ShiftStatus },
  ) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });

    if (!membership) {
      throw new BadRequestException('Musisz należeć do zespołu (ACTIVE), żeby tworzyć zmiany.');
    }

    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner lub Manager może tworzyć zmiany.');
    }

    let resolvedRoleName = data.roleName || '';
    let resolvedPositionId = data.positionId || null;

    if (resolvedPositionId) {
      const position = await this.prisma.position.findFirst({
        where: { id: resolvedPositionId, teamId: membership.teamId },
      });
      if (!position) throw new BadRequestException('Stanowisko nie istnieje.');
      resolvedRoleName = position.name;
    }

    if (!resolvedRoleName) {
      throw new BadRequestException('Podaj stanowisko (positionId) lub nazwę roli (roleName).');
    }

    return this.prisma.shift.create({
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        roleName: resolvedRoleName,
        positionId: resolvedPositionId,
        status: data.status ?? ShiftStatus.DRAFT,
        teamId: membership.teamId,
      },
      include: {
        position: true,
        assignments: { include: { user: true } },
      },
    });
  }

  /** Walidacja przypisania pracownika do zmiany (sprawdza dostępność, konflikty, dobę pracowniczą). */
  async validateAssignmentForShift(
    requesterId: string,
    shiftId: string,
    targetUserId: string,
  ) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }

    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, teamId: membership.teamId },
    });
    if (!shift) {
      throw new NotFoundException('Zmiana nie istnieje.');
    }

    return this.shiftValidation.validateAssignment(
      targetUserId,
      membership.teamId,
      shift.startTime,
      shift.endTime,
      shiftId,
    );
  }

  /** Dodanie jednej pozycji do zmiany (przypisanie pracownika lub wolna pozycja na giełdzie). */
  async addAssignment(
    requesterId: string,
    shiftId: string,
    data: { userId?: string; isUpForGrabs?: boolean },
  ) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner/Manager może dodawać przypisania.');
    }

    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, teamId: membership.teamId },
    });
    if (!shift) {
      throw new NotFoundException('Zmiana nie istnieje lub nie należy do Twojego zespołu.');
    }

    // Validate assignment if assigning to a specific user
    if (data.userId) {
      const validation = await this.shiftValidation.validateAssignment(
        data.userId,
        membership.teamId,
        shift.startTime,
        shift.endTime,
        shiftId,
      );
      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Nie można przypisać pracownika do zmiany.',
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }
    }

    const created = await this.prisma.shiftAssignment.create({
      data: {
        shiftId,
        userId: data.userId ?? null,
        isUpForGrabs: data.isUpForGrabs ?? false,
      },
      include: {
        shift: true,
        user: true,
      },
    });

    // Notify employee when assigned (only for published shifts to avoid draft spam)
    if (data.userId && shift.status === ShiftStatus.PUBLISHED) {
      this.notifications
        .notifyShiftAssigned(
          data.userId,
          membership.teamId,
          shift.roleName,
          formatShiftDate(shift.startTime),
          formatShiftTime(shift.startTime, shift.endTime),
        )
        .catch(() => {});

      // Email notification (fire-and-forget, respects settings)
      this.sendShiftAssignedEmail(
        data.userId,
        membership.teamId,
        shift.roleName,
        shift.startTime,
        shift.endTime,
      ).catch(() => {});
    }

    // Notify employees when shift put on marketplace
    if (data.isUpForGrabs && shift.status === ShiftStatus.PUBLISHED) {
      this.notifications
        .notifyShiftOnMarketplace(
          membership.teamId,
          requesterId,
          shift.roleName,
          formatShiftDate(shift.startTime),
          formatShiftTime(shift.startTime, shift.endTime),
        )
        .catch(() => {});
    }

    return created;
  }

  /** Usunięcie przypisania (tylko Owner/Manager). */
  async removeAssignment(requesterId: string, assignmentId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner/Manager może usuwać przypisania.');
    }

    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: { id: assignmentId },
      include: { shift: true },
    });
    if (!assignment || assignment.shift.teamId !== membership.teamId) {
      throw new NotFoundException('Przypisanie nie istnieje lub nie należy do Twojego zespołu.');
    }

    await this.prisma.shiftAssignment.delete({ where: { id: assignmentId } });
    return { success: true };
  }

  /** Edycja przypisania (Owner/Manager): zmiana użytkownika lub ustawienie giełdy. */
  async updateAssignment(
    requesterId: string,
    assignmentId: string,
    data: { userId?: string | null; isUpForGrabs?: boolean },
  ) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner/Manager może edytować przypisania.');
    }

    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: { id: assignmentId },
      include: { shift: true },
    });
    if (!assignment || assignment.shift.teamId !== membership.teamId) {
      throw new NotFoundException('Przypisanie nie istnieje lub nie należy do Twojego zespołu.');
    }

    const updateData: { userId?: string | null; isUpForGrabs?: boolean } = {};
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.isUpForGrabs !== undefined) updateData.isUpForGrabs = data.isUpForGrabs;

    return this.prisma.shiftAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: { shift: true, user: true },
    });
  }

  /** Lista pozycji na giełdzie (assignments z isUpForGrabs). Tylko z opublikowanych zmian. */
  async getMarketplace(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      return [];
    }

    return this.prisma.shiftAssignment.findMany({
      where: {
        isUpForGrabs: true,
        shift: {
          teamId: membership.teamId,
          status: ShiftStatus.PUBLISHED,
        },
      },
      include: {
        shift: true,
        user: true,
      },
      orderBy: { shift: { startTime: 'asc' } },
    });
  }

  /** Lista użytkowników zespołu (tylko członkowie aktywnego zespołu). */
  async getAllUsers(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      return [];
    }
    return this.prisma.user.findMany({
      where: { teamId: membership.teamId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        provider: true,
        skills: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }
  

  /** Przejęcie pozycji z giełdy (pessimistic lock) z walidacją. */
  async claimAssignment(assignmentId: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const membership = await tx.teamMembership.findFirst({
          where: { userId, status: MembershipStatus.ACTIVE },
        });
        if (!membership) {
          throw new ForbiddenException('Brak aktywnego członkostwa w zespole.');
        }

        const raw = await tx.$queryRaw<
          { id: string; shiftId: string; userId: string | null; isUpForGrabs: boolean }[]
        >`
          SELECT id, "shiftId", "userId", "isUpForGrabs"
          FROM "ShiftAssignment"
          WHERE id = ${assignmentId}
          FOR UPDATE
        `;
        const assignment = raw[0];
        if (!assignment) {
          throw new NotFoundException('Przypisanie nie istnieje.');
        }

        const shift = await tx.shift.findUnique({
          where: { id: assignment.shiftId },
          select: { teamId: true, startTime: true, endTime: true, status: true },
        });
        if (!shift || shift.teamId !== membership.teamId) {
          throw new ForbiddenException('Nie możesz przejąć pozycji z innego zespołu.');
        }
        if (shift.status !== ShiftStatus.PUBLISHED) {
          throw new BadRequestException('Można przejmować pozycje tylko z opublikowanych zmian.');
        }
        if (!assignment.isUpForGrabs) {
          throw new BadRequestException('Ta pozycja nie jest dostępna na giełdzie.');
        }

        // Validate the claim: check conflicts and rest period
        const validation = await this.shiftValidation.validateAssignment(
          userId,
          membership.teamId,
          shift.startTime,
          shift.endTime,
          assignment.shiftId,
        );

        if (!validation.valid) {
          throw new BadRequestException({
            message: 'Nie możesz przejąć tej zmiany.',
            errors: validation.errors,
            warnings: validation.warnings,
          });
        }

        return tx.shiftAssignment.update({
          where: { id: assignmentId },
          data: { isUpForGrabs: false, userId },
          include: { shift: true, user: true },
        });
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /** Oddanie swojej pozycji na giełdę. */
  async releaseAssignment(assignmentId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const raw = await tx.$queryRaw<{ id: string; userId: string | null }[]>`
        SELECT id, "userId" FROM "ShiftAssignment" WHERE id = ${assignmentId} FOR UPDATE
      `;
      const assignment = raw[0];
      if (!assignment) {
        throw new NotFoundException('Przypisanie nie istnieje.');
      }
      if (assignment.userId !== userId) {
        throw new BadRequestException('Nie możesz oddać cudzej pozycji.');
      }

      return tx.shiftAssignment.update({
        where: { id: assignmentId },
        data: { isUpForGrabs: true },
        include: { shift: true, user: true },
      });
    });
  }

  /**
   * Publikacja zmian – zmiana statusu z DRAFT na PUBLISHED.
   * Waliduje przypisania przed publikacją.
   * Accepts array of shift IDs or a date range (publishes all drafts in range).
   */
  async publishShifts(
    requesterId: string,
    data: { shiftIds?: string[]; from?: string; to?: string },
  ) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner/Manager może publikować grafik.');
    }

    let shiftIds: string[];

    if (data.shiftIds && data.shiftIds.length > 0) {
      shiftIds = data.shiftIds;
    } else if (data.from && data.to) {
      const drafts = await this.prisma.shift.findMany({
        where: {
          teamId: membership.teamId,
          status: ShiftStatus.DRAFT,
          startTime: { gte: new Date(data.from) },
          endTime: { lte: new Date(data.to) },
        },
        select: { id: true },
      });
      shiftIds = drafts.map((s) => s.id);
    } else {
      throw new BadRequestException('Podaj shiftIds lub zakres dat (from/to).');
    }

    if (shiftIds.length === 0) {
      return { published: 0, warnings: [] };
    }

    // Validate all assignments before publishing
    const allWarnings: string[] = [];

    for (const shiftId of shiftIds) {
      const shift = await this.prisma.shift.findFirst({
        where: { id: shiftId, teamId: membership.teamId, status: ShiftStatus.DRAFT },
      });
      if (!shift) continue;

      const validationResults = await this.shiftValidation.validateShiftForPublish(
        shiftId,
        membership.teamId,
        shift.startTime,
        shift.endTime,
      );

      for (const vr of validationResults) {
        if (!vr.result.valid) {
          allWarnings.push(
            `${vr.userName}: ${vr.result.errors.join('; ')}`,
          );
        }
        if (vr.result.warnings.length > 0) {
          allWarnings.push(
            `${vr.userName}: ${vr.result.warnings.join('; ')}`,
          );
        }
      }
    }

    // Publish shifts (even with warnings — manager decides)
    const result = await this.prisma.shift.updateMany({
      where: {
        id: { in: shiftIds },
        teamId: membership.teamId,
        status: ShiftStatus.DRAFT,
      },
      data: { status: ShiftStatus.PUBLISHED },
    });

    this.logger.log(
      `Published ${result.count} shifts for team ${membership.teamId} by user ${requesterId}`,
    );

    // Notify employees about new published schedule (one notification, not per-shift)
    if (result.count > 0) {
      this.notifications
        .notifySchedulePublished(membership.teamId, result.count)
        .catch(() => {});

      // Send batch email per employee (fire-and-forget, respects TeamSettings)
      this.sendPublishEmails(membership.teamId, shiftIds).catch(() => {});
    }

    return {
      published: result.count,
      warnings: allWarnings,
    };
  }

  // ── Copy week ──────────────────────────────────────────────

  /** Preview what would be copied from sourceWeek to targetWeek */
  async previewCopyWeek(
    requesterId: string,
    sourceWeekStart: string,
    targetWeekStart: string,
    structureOnly: boolean,
  ) {
    const membership = await this.requireManager(requesterId);
    const sourceShifts = await this.getWeekShifts(membership.teamId, sourceWeekStart);

    return sourceShifts.map((shift) => ({
      roleName: shift.roleName,
      startTime: shift.startTime.toISOString(),
      endTime: shift.endTime.toISOString(),
      assignees: structureOnly
        ? []
        : shift.assignments
            .filter((a) => a.userId)
            .map((a) => ({
              userId: a.userId,
              name: a.user?.nickname || a.user?.name || '?',
            })),
      newStartTime: this.shiftDateToTargetWeek(shift.startTime, sourceWeekStart, targetWeekStart).toISOString(),
      newEndTime: this.shiftDateToTargetWeek(shift.endTime, sourceWeekStart, targetWeekStart).toISOString(),
    }));
  }

  /** Copy all shifts from source week to target week as DRAFTs */
  async copyWeek(
    requesterId: string,
    sourceWeekStart: string,
    targetWeekStart: string,
    structureOnly: boolean,
  ) {
    const membership = await this.requireManager(requesterId);

    // Verify target week is empty (prevent accidental duplicates)
    const targetShifts = await this.getWeekShifts(membership.teamId, targetWeekStart);
    if (targetShifts.length > 0) {
      throw new BadRequestException(
        `Docelowy tydzień ma już ${targetShifts.length} zmian. Usuń je najpierw lub wybierz pusty tydzień.`,
      );
    }

    const sourceShifts = await this.getWeekShifts(membership.teamId, sourceWeekStart);

    if (sourceShifts.length === 0) {
      throw new BadRequestException('Brak zmian w wybranym tygodniu do skopiowania.');
    }

    let copiedCount = 0;

    for (const shift of sourceShifts) {
      const newStart = this.shiftDateToTargetWeek(shift.startTime, sourceWeekStart, targetWeekStart);
      const newEnd = this.shiftDateToTargetWeek(shift.endTime, sourceWeekStart, targetWeekStart);

      const newShift = await this.prisma.shift.create({
        data: {
          teamId: membership.teamId,
          startTime: newStart,
          endTime: newEnd,
          roleName: shift.roleName,
          status: ShiftStatus.DRAFT,
        },
      });

      if (!structureOnly) {
        for (const assignment of shift.assignments) {
          await this.prisma.shiftAssignment.create({
            data: {
              shiftId: newShift.id,
              userId: assignment.userId,
              isUpForGrabs: false,
            },
          });
        }
      }

      copiedCount++;
    }

    this.logger.log(
      `Copied ${copiedCount} shifts from ${sourceWeekStart} to ${targetWeekStart} ` +
      `(team=${membership.teamId}, structureOnly=${structureOnly})`,
    );

    return { copied: copiedCount, structureOnly };
  }

  private async getWeekShifts(teamId: string, weekStart: string) {
    const from = new Date(weekStart);
    const to = new Date(weekStart);
    to.setDate(to.getDate() + 7);

    return this.prisma.shift.findMany({
      where: {
        teamId,
        startTime: { gte: from, lt: to },
      },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, nickname: true } } },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /** Translate a shift's datetime from source week to the same day-of-week in target week */
  private shiftDateToTargetWeek(dt: Date, sourceWeekStart: string, targetWeekStart: string): Date {
    const source = new Date(sourceWeekStart);
    const target = new Date(targetWeekStart);
    const diffMs = dt.getTime() - source.getTime();
    return new Date(target.getTime() + diffMs);
  }

  private async requireManager(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner/Manager może wykonać tę operację.');
    }
    return membership;
  }

  /** Send 1 batch email per employee listing their published shifts */
  private async sendPublishEmails(teamId: string, shiftIds: string[]) {
    try {
      // Check team notification settings
      const settings = await this.prisma.teamSettings.findUnique({ where: { teamId } });
      if (settings && !settings.notifyShiftPublished) return;

      const publishedShifts = await this.prisma.shift.findMany({
        where: { id: { in: shiftIds }, teamId, status: ShiftStatus.PUBLISHED },
        include: {
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      // Group shifts by employee
      const byEmployee = new Map<string, { email: string; name: string; shifts: { roleName: string; date: string; time: string }[] }>();
      for (const shift of publishedShifts) {
        for (const a of shift.assignments) {
          if (!a.userId || !a.user?.email) continue;
          if (!byEmployee.has(a.userId)) {
            byEmployee.set(a.userId, { email: a.user.email, name: a.user.name, shifts: [] });
          }
          byEmployee.get(a.userId)!.shifts.push({
            roleName: shift.roleName,
            date: formatShiftDate(shift.startTime),
            time: formatShiftTime(shift.startTime, shift.endTime),
          });
        }
      }

      // Send one email per employee
      for (const [, emp] of byEmployee) {
        this.emailService
          .sendSchedulePublishedEmail(emp.email, emp.name, emp.shifts)
          .catch(() => {});
      }
    } catch (e) {
      this.logger.error('Failed to send publish emails', e);
    }
  }

  /** Send email when employee is assigned to a published shift */
  private async sendShiftAssignedEmail(
    userId: string,
    teamId: string,
    roleName: string,
    startTime: Date,
    endTime: Date,
  ) {
    try {
      const settings = await this.prisma.teamSettings.findUnique({ where: { teamId } });
      if (settings && !settings.notifyShiftAssigned) return;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user?.email) return;

      await this.emailService.sendShiftAssignedEmail(
        user.email,
        user.name,
        roleName,
        formatShiftDate(startTime),
        formatShiftTime(startTime, endTime),
      );
    } catch (e) {
      this.logger.error('Failed to send shift assigned email', e);
    }
  }

  async syncUserByEmail(email: string, name: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { team: true },
    });

    if (!user) {
      // Nowy użytkownik – domyślne imię i pseudonim do uzupełnienia przez administratora
      user = await this.prisma.user.create({
        data: {
          email,
          name: DEFAULT_USER_NAME,
          nickname: DEFAULT_USER_NICKNAME,
          role: 'EMPLOYEE',
          provider: 'google',
          status: 'ACTIVE',
        },
        include: { team: true },
      });
    } else {
      // Użytkownik już istnieje - NIE aktualizujemy nazwy, bo użytkownik mógł ją zmienić ręcznie
      // Aktualizujemy tylko provider jeśli potrzeba
      const updateData: any = {};
      
      if (!user.password && user.provider !== 'google') {
        updateData.provider = 'google';
      }
      
      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { email },
          data: updateData,
          include: { team: true },
        });
      }
    }
    return user;
  }

  async createTeam(userId: string, teamName: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });

      if (user?.teamId) {
        throw new BadRequestException('Już należysz do zespołu. Nie możesz utworzyć nowego zespołu.');
      }

      const activeMembership = await tx.teamMembership.findFirst({
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (activeMembership) {
        throw new BadRequestException('Masz już aktywne członkostwo w zespole. Nie możesz utworzyć nowego zespołu.');
      }

      const inviteCode = nanoid(12);
      const team = await tx.team.create({
        data: { 
          name: teamName,
          inviteCode: inviteCode,
        },
      });

      await tx.teamMembership.create({
        data: {
          userId,
          teamId: team.id,
          status: MembershipStatus.ACTIVE,
          role: Role.OWNER,
          approvedAt: new Date(),
          approvedBy: userId,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          teamId: team.id,
          role: Role.OWNER,
        },
        include: { team: true },
      });

      return { team, user: updatedUser };
    }).then((result) => {
      if (result.user.email) {
        this.emailService
          .sendWelcomeEmailOwner(
            result.user.email,
            result.user.name || 'Właścicielu',
            result.team.name,
          )
          .catch(() => {});
      }
      return result;
    });
  }
  async joinTeam(userId: string, code: string) {
    const team = await this.prisma.team.findUnique({
      where: { inviteCode: code },
    });

    if (!team) {
      throw new BadRequestException('Nieprawidłowy kod zespołu.');
    }

    const applicant = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!applicant) {
      throw new NotFoundException('Użytkownik nie istnieje.');
    }

    const existing = await this.prisma.teamMembership.findUnique({
      where: {
        userId_teamId: { userId, teamId: team.id },
      },
    });

    if (existing?.status === MembershipStatus.ACTIVE) {
      throw new BadRequestException('Już należysz do tego zespołu.');
    }

    if (existing?.status === MembershipStatus.PENDING) {
      return { status: MembershipStatus.PENDING, team };
    }

    if (existing) {
      await this.prisma.teamMembership.update({
        where: {
          userId_teamId: { userId, teamId: team.id },
        },
        data: {
          status: MembershipStatus.PENDING,
          requestedAt: new Date(),
        },
      });
    } else {
      await this.prisma.teamMembership.create({
        data: {
          userId,
          teamId: team.id,
          status: MembershipStatus.PENDING,
          role: Role.EMPLOYEE,
        },
      });
    }

    const managers = await this.prisma.teamMembership.findMany({
      where: {
        teamId: team.id,
        status: MembershipStatus.ACTIVE,
        role: { in: [Role.OWNER, Role.MANAGER] },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    managers.forEach((membership) => {
      if (membership.user.email && applicant.email) {
        this.emailService
          .sendJoinRequestNotification(
            membership.user.email,
            membership.user.name || 'Menedżerze',
            applicant.name || 'Użytkownik',
            applicant.email,
            team.name,
          )
          .catch(() => {});
      }
    });

    return { status: MembershipStatus.PENDING, team };
  }
  async getMyMembershipStatus(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });

    if (!membership) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });
      return { status: user?.teamId ? MembershipStatus.ACTIVE : null };
    }

    return { status: membership.status };
  }

  async getTeamMembers(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });

    if (!membership) {
      throw new BadRequestException('Nie należysz do żadnego zespołu.');
    }

    const members = await this.prisma.teamMembership.findMany({
      where: { teamId: membership.teamId, status: MembershipStatus.ACTIVE },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phoneNumber: true,
            skills: true,
            nickname: true,
            hourlyRate: true,
            maxHours: true,
            avatarUrl: true,
            notes: true,
            employeePositions: { include: { position: true } },
          },
        },
      },
    });

    return members.map((m) => ({
      ...m.user,
      positions: m.user.employeePositions.map((ep: any) => ep.position),
    }));
  }
  async updateProfile(userId: string, data: { name?: string; phoneNumber?: string }) {
    const updateData: any = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }
  async updateEmployee(
    requesterId: string,
    targetUserId: string,
    data: {
      name?: string;
      nickname?: string | null;
      hourlyRate?: number | null;
      maxHours?: number | null;
      skills?: string[];
      notes?: string | null;
    }
  ) {
    const requesterMembership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!requesterMembership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }

    if (requesterMembership.role !== Role.OWNER && requesterMembership.role !== Role.MANAGER) {
      throw new ForbiddenException('Brak uprawnień. Tylko Owner/Manager może to robić.');
    }

    const targetMembership = await this.prisma.teamMembership.findFirst({
      where: { userId: targetUserId, teamId: requesterMembership.teamId, status: MembershipStatus.ACTIVE },
    });

    if (!targetMembership) {
      throw new BadRequestException('Użytkownik nie jest aktywnym członkiem zespołu.');
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.nickname !== undefined) {
      updateData.nickname = data.nickname;
    }
    if (data.hourlyRate !== undefined) {
      updateData.hourlyRate = data.hourlyRate !== null ? data.hourlyRate : null;
    }
    if (data.maxHours !== undefined) {
      updateData.maxHours = data.maxHours !== null ? data.maxHours : null;
    }
    if (data.skills !== undefined) {
      updateData.skills = data.skills;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });
  }

  async getPendingMembers(requesterId: string) {
    const requesterMembership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!requesterMembership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (requesterMembership.role !== Role.OWNER && requesterMembership.role !== Role.MANAGER) {
      throw new ForbiddenException('Brak uprawnień. Tylko Owner/Manager może to robić.');
    }

    return this.prisma.teamMembership.findMany({
      where: { teamId: requesterMembership.teamId, status: MembershipStatus.PENDING },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { requestedAt: 'asc' },
    });
  }

  async approveMember(requesterId: string, membershipId: string) {
    const requesterMembership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!requesterMembership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (requesterMembership.role !== Role.OWNER && requesterMembership.role !== Role.MANAGER) {
      throw new ForbiddenException('Brak uprawnień. Tylko Owner/Manager może to robić.');
    }

    const membership = await this.prisma.teamMembership.findUnique({
      where: { id: membershipId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!membership || membership.teamId !== requesterMembership.teamId) {
      throw new BadRequestException('Zgłoszenie nie istnieje lub jest w innym zespole.');
    }
    if (membership.status !== MembershipStatus.PENDING) {
      throw new BadRequestException('To zgłoszenie nie jest w statusie PENDING.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedMembership = await tx.teamMembership.update({
        where: { id: membershipId },
        data: {
          status: MembershipStatus.ACTIVE,
          approvedAt: new Date(),
          approvedBy: requesterId,
        },
      });

      await tx.user.update({
        where: { id: membership.userId },
        data: {
          teamId: membership.teamId,
          role: membership.role ?? Role.EMPLOYEE,
        },
      });

      return updatedMembership;
    });

    if (membership.user.email) {
      this.emailService
        .sendMembershipApprovedNotification(
          membership.user.email,
          membership.user.name || 'Użytkowniku',
          membership.team.name,
        )
        .catch(() => {});
      
      this.emailService
        .sendWelcomeEmailEmployee(
          membership.user.email,
          membership.user.name || 'Użytkowniku',
          membership.team.name,
        )
        .catch(() => {});
    }

    return result;
  }

  async rejectMember(requesterId: string, membershipId: string) {
    const requesterMembership = await this.prisma.teamMembership.findFirst({
      where: { userId: requesterId, status: MembershipStatus.ACTIVE },
    });
    if (!requesterMembership) {
      throw new BadRequestException('Brak aktywnego członkostwa.');
    }
    if (requesterMembership.role !== Role.OWNER && requesterMembership.role !== Role.MANAGER) {
      throw new ForbiddenException('Brak uprawnień. Tylko Owner/Manager może to robić.');
    }

    const membership = await this.prisma.teamMembership.findUnique({
      where: { id: membershipId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!membership || membership.teamId !== requesterMembership.teamId) {
      throw new BadRequestException('Zgłoszenie nie istnieje lub jest w innym zespole.');
    }
    if (membership.status !== MembershipStatus.PENDING) {
      throw new BadRequestException('To zgłoszenie nie jest w statusie PENDING.');
    }

    const result = await this.prisma.teamMembership.update({
      where: { id: membershipId },
      data: {
        status: MembershipStatus.REJECTED,
        approvedAt: new Date(),
        approvedBy: requesterId,
      },
    });

    if (membership.user.email) {
      this.emailService
        .sendMembershipRejectedNotification(
          membership.user.email,
          membership.user.name || 'Użytkowniku',
          membership.team.name,
        )
        .catch(() => {});
    }

    return result;
  }

}