import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, Role, ShiftStatus } from '@prisma/client';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateTemplateFromWeekDto } from './dto/create-template-from-week.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ApplyTemplateDto } from './dto/apply-template.dto';

const MAX_TEMPLATES_PER_TEAM = 20;

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async requireManager(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) {
      throw new ForbiddenException('Brak aktywnego członkostwa w zespole.');
    }
    if (
      membership.role !== Role.OWNER &&
      membership.role !== Role.MANAGER
    ) {
      throw new ForbiddenException(
        'Tylko Owner lub Manager może zarządzać szablonami.',
      );
    }
    return membership;
  }

  private async ensureTemplateLimit(teamId: string) {
    const count = await this.prisma.scheduleTemplate.count({
      where: { teamId },
    });
    if (count >= MAX_TEMPLATES_PER_TEAM) {
      throw new BadRequestException(
        `Osiągnięto limit ${MAX_TEMPLATES_PER_TEAM} szablonów. Usuń nieużywane szablony, aby dodać nowe.`,
      );
    }
  }

  async getAll(userId: string) {
    const membership = await this.requireManager(userId);

    return this.prisma.scheduleTemplate.findMany({
      where: { teamId: membership.teamId },
      include: {
        createdBy: { select: { id: true, name: true, nickname: true } },
        _count: { select: { shifts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(userId: string, templateId: string) {
    const membership = await this.requireManager(userId);

    const template = await this.prisma.scheduleTemplate.findUnique({
      where: { id: templateId },
      include: {
        createdBy: { select: { id: true, name: true, nickname: true } },
        shifts: {
          include: {
            position: { select: { id: true, name: true, color: true } },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }, { startMinute: 'asc' }],
        },
      },
    });

    if (!template || template.teamId !== membership.teamId) {
      throw new NotFoundException('Szablon nie istnieje.');
    }

    return template;
  }

  async create(userId: string, dto: CreateTemplateDto) {
    const membership = await this.requireManager(userId);
    await this.ensureTemplateLimit(membership.teamId);

    const template = await this.prisma.scheduleTemplate.create({
      data: {
        teamId: membership.teamId,
        createdById: userId,
        name: dto.name,
        description: dto.description,
        shifts: {
          create: dto.shifts.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startHour: s.startHour,
            startMinute: s.startMinute,
            endHour: s.endHour,
            endMinute: s.endMinute,
            roleName: s.roleName,
            positionId: s.positionId,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, nickname: true } },
        _count: { select: { shifts: true } },
      },
    });

    this.logger.log(
      `Template "${template.name}" created by ${userId} (team=${membership.teamId}, shifts=${dto.shifts.length})`,
    );

    return template;
  }

  async createFromWeek(userId: string, dto: CreateTemplateFromWeekDto) {
    const membership = await this.requireManager(userId);
    await this.ensureTemplateLimit(membership.teamId);

    const from = new Date(dto.weekStart);
    const to = new Date(dto.weekStart);
    to.setDate(to.getDate() + 7);

    const shifts = await this.prisma.shift.findMany({
      where: {
        teamId: membership.teamId,
        startTime: { gte: from, lt: to },
      },
      include: {
        position: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    if (shifts.length === 0) {
      throw new BadRequestException(
        'Brak zmian w wybranym tygodniu. Nie można utworzyć pustego szablonu.',
      );
    }

    const weekStartDate = new Date(dto.weekStart);

    const templateShifts = shifts.map((shift) => {
      const dayOfWeek = this.getDayOfWeekRelative(shift.startTime, weekStartDate);
      return {
        dayOfWeek,
        startHour: shift.startTime.getUTCHours(),
        startMinute: shift.startTime.getUTCMinutes(),
        endHour: shift.endTime.getUTCHours(),
        endMinute: shift.endTime.getUTCMinutes(),
        roleName: shift.roleName,
        positionId: shift.positionId,
      };
    });

    const template = await this.prisma.scheduleTemplate.create({
      data: {
        teamId: membership.teamId,
        createdById: userId,
        name: dto.name,
        description: dto.description,
        shifts: { create: templateShifts },
      },
      include: {
        createdBy: { select: { id: true, name: true, nickname: true } },
        _count: { select: { shifts: true } },
      },
    });

    this.logger.log(
      `Template "${template.name}" created from week ${dto.weekStart} by ${userId} (shifts=${templateShifts.length})`,
    );

    return template;
  }

  async update(userId: string, templateId: string, dto: UpdateTemplateDto) {
    const membership = await this.requireManager(userId);

    const template = await this.prisma.scheduleTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || template.teamId !== membership.teamId) {
      throw new NotFoundException('Szablon nie istnieje.');
    }

    return this.prisma.scheduleTemplate.update({
      where: { id: templateId },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        createdBy: { select: { id: true, name: true, nickname: true } },
        _count: { select: { shifts: true } },
      },
    });
  }

  async remove(userId: string, templateId: string) {
    const membership = await this.requireManager(userId);

    const template = await this.prisma.scheduleTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || template.teamId !== membership.teamId) {
      throw new NotFoundException('Szablon nie istnieje.');
    }

    await this.prisma.scheduleTemplate.delete({ where: { id: templateId } });

    this.logger.log(
      `Template "${template.name}" deleted by ${userId} (team=${membership.teamId})`,
    );

    return { deleted: true };
  }

  async apply(userId: string, templateId: string, dto: ApplyTemplateDto) {
    const membership = await this.requireManager(userId);

    const template = await this.prisma.scheduleTemplate.findUnique({
      where: { id: templateId },
      include: { shifts: true },
    });

    if (!template || template.teamId !== membership.teamId) {
      throw new NotFoundException('Szablon nie istnieje.');
    }

    if (template.shifts.length === 0) {
      throw new BadRequestException('Szablon nie zawiera żadnych zmian.');
    }

    const targetMonday = new Date(dto.targetWeekStart);

    const targetEnd = new Date(targetMonday);
    targetEnd.setDate(targetEnd.getDate() + 7);

    const existingShifts = await this.prisma.shift.count({
      where: {
        teamId: membership.teamId,
        startTime: { gte: targetMonday, lt: targetEnd },
      },
    });

    if (existingShifts > 0) {
      throw new BadRequestException(
        `Docelowy tydzień ma już ${existingShifts} zmian. Usuń je najpierw lub wybierz pusty tydzień.`,
      );
    }

    let createdCount = 0;

    for (const ts of template.shifts) {
      const startTime = this.templateShiftToDate(targetMonday, ts.dayOfWeek, ts.startHour, ts.startMinute);
      const endTime = this.templateShiftToDate(targetMonday, ts.dayOfWeek, ts.endHour, ts.endMinute);

      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      await this.prisma.shift.create({
        data: {
          teamId: membership.teamId,
          startTime,
          endTime,
          roleName: ts.roleName,
          positionId: ts.positionId,
          status: ShiftStatus.DRAFT,
        },
      });

      createdCount++;
    }

    this.logger.log(
      `Template "${template.name}" applied to week ${dto.targetWeekStart} by ${userId} (created=${createdCount})`,
    );

    return { created: createdCount, templateName: template.name };
  }

  private getDayOfWeekRelative(date: Date, weekStart: Date): number {
    const diffMs = date.getTime() - weekStart.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, Math.min(6, diffDays));
  }

  private templateShiftToDate(
    weekMonday: Date,
    dayOfWeek: number,
    hour: number,
    minute: number,
  ): Date {
    const d = new Date(weekMonday);
    d.setUTCDate(d.getUTCDate() + dayOfWeek);
    d.setUTCHours(hour, minute, 0, 0);
    return d;
  }
}
