import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, Role } from '@prisma/client';
import { MIN_AVAILABILITY_MINUTES, MAX_QUERY_RANGE_DAYS } from './constants';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMembership(userId: string) {
    const m = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
      select: { teamId: true, role: true },
    });
    if (!m) throw new BadRequestException('Brak aktywnego zespołu.');
    return m;
  }

  private validateSlot(start: Date, end: Date): void {
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('endDateTime musi być późniejsze niż startDateTime.');
    }
    const minutes = (end.getTime() - start.getTime()) / (60 * 1000);
    if (minutes < MIN_AVAILABILITY_MINUTES) {
      throw new BadRequestException(
        `Minimalna długość slotu to 4 godziny (obecnie ${Math.round(minutes)} min).`,
      );
    }
  }

  private async checkOverlap(
    userId: string,
    teamId: string,
    start: Date,
    end: Date,
    excludeSlotId?: string,
  ): Promise<void> {
    const existing = await this.prisma.availabilitySlot.findMany({
      where: {
        userId,
        teamId,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
        OR: [
          {
            startDateTime: { lt: end },
            endDateTime: { gt: start },
          },
        ],
      },
    });
    if (existing.length > 0) {
      throw new BadRequestException(
        'Slot nakłada się z inną Twoją dostępnością. Usuń lub zmień istniejący slot.',
      );
    }
  }

  async createSlots(
    userId: string,
    body: { slots: { startDateTime: string; endDateTime: string }[] },
  ) {
    const { teamId } = await this.getMembership(userId);

    const created: { id: string; startDateTime: Date; endDateTime: Date }[] = [];

    for (const slot of body.slots) {
      const start = new Date(slot.startDateTime);
      const end = new Date(slot.endDateTime);
      this.validateSlot(start, end);
      await this.checkOverlap(userId, teamId, start, end);
    }

    return this.prisma.$transaction(
      body.slots.map((slot) => {
        const start = new Date(slot.startDateTime);
        const end = new Date(slot.endDateTime);
        return this.prisma.availabilitySlot.create({
          data: {
            userId,
            teamId,
            startDateTime: start,
            endDateTime: end,
          },
        });
      }),
    );
  }

  async findMySlots(userId: string, from?: string, to?: string) {
    const { teamId } = await this.getMembership(userId);

    let start: Date;
    let end: Date;
    if (from && to) {
      start = new Date(from);
      end = new Date(to);
    } else {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start = new Date(now);
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    }

    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('Parametr "to" musi być późniejszy niż "from".');
    }
    const daysRange = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    if (daysRange > MAX_QUERY_RANGE_DAYS) {
      throw new BadRequestException(
        `Maksymalny zakres zapytania to ${MAX_QUERY_RANGE_DAYS} dni.`,
      );
    }

    return this.prisma.availabilitySlot.findMany({
      where: {
        userId,
        teamId,
        startDateTime: { lt: end },
        endDateTime: { gt: start },
      },
      orderBy: { startDateTime: 'asc' },
    });
  }

  async findTeamSlots(requesterId: string, from?: string, to?: string) {
    const membership = await this.getMembership(requesterId);
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner lub Manager może przeglądać dostępności zespołu.');
    }

    if (!from || !to) {
      throw new BadRequestException('Dla widoku zespołu podaj parametry from i to (daty ISO).');
    }
    const start = new Date(from);
    const end = new Date(to);
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('Parametr "to" musi być późniejszy niż "from".');
    }
    const daysRange = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    if (daysRange > MAX_QUERY_RANGE_DAYS) {
      throw new BadRequestException(
        `Maksymalny zakres zapytania to ${MAX_QUERY_RANGE_DAYS} dni.`,
      );
    }

    return this.prisma.availabilitySlot.findMany({
      where: {
        teamId: membership.teamId,
        startDateTime: { lt: end },
        endDateTime: { gt: start },
      },
      include: {
        user: {
          select: { id: true, name: true, nickname: true },
        },
      },
      orderBy: [{ startDateTime: 'asc' }, { userId: 'asc' }],
    });
  }

  async deleteSlot(userId: string, slotId: string) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) throw new NotFoundException('Slot nie istnieje.');
    if (slot.userId !== userId) {
      throw new ForbiddenException('Możesz usuwać tylko własne sloty.');
    }
    await this.prisma.availabilitySlot.delete({ where: { id: slotId } });
    return { success: true };
  }
}
