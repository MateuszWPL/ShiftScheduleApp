import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, Role } from '@prisma/client';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireManager(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) throw new BadRequestException('Brak aktywnego zespołu.');
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner/Manager może zarządzać stanowiskami.');
    }
    return membership;
  }

  private async requireMember(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) throw new BadRequestException('Brak aktywnego zespołu.');
    return membership;
  }

  async getPositions(userId: string) {
    const membership = await this.requireMember(userId);
    return this.prisma.position.findMany({
      where: { teamId: membership.teamId },
      include: {
        _count: { select: { employees: true, shifts: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createPosition(userId: string, data: { name: string; color?: string }) {
    const membership = await this.requireManager(userId);

    const existing = await this.prisma.position.findUnique({
      where: { teamId_name: { teamId: membership.teamId, name: data.name } },
    });
    if (existing) {
      throw new BadRequestException(`Stanowisko "${data.name}" już istnieje.`);
    }

    return this.prisma.position.create({
      data: {
        teamId: membership.teamId,
        name: data.name,
        color: data.color || '#8FACDB',
      },
    });
  }

  async updatePosition(userId: string, positionId: string, data: { name?: string; color?: string }) {
    const membership = await this.requireManager(userId);

    const position = await this.prisma.position.findFirst({
      where: { id: positionId, teamId: membership.teamId },
    });
    if (!position) throw new NotFoundException('Stanowisko nie istnieje.');

    if (data.name && data.name !== position.name) {
      const duplicate = await this.prisma.position.findUnique({
        where: { teamId_name: { teamId: membership.teamId, name: data.name } },
      });
      if (duplicate) throw new BadRequestException(`Stanowisko "${data.name}" już istnieje.`);
    }

    return this.prisma.position.update({
      where: { id: positionId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.color && { color: data.color }),
      },
    });
  }

  async deletePosition(userId: string, positionId: string) {
    const membership = await this.requireManager(userId);

    const position = await this.prisma.position.findFirst({
      where: { id: positionId, teamId: membership.teamId },
    });
    if (!position) throw new NotFoundException('Stanowisko nie istnieje.');

    await this.prisma.position.delete({ where: { id: positionId } });
    return { deleted: true };
  }

  async assignPositionsToEmployee(userId: string, targetUserId: string, positionIds: string[]) {
    const membership = await this.requireManager(userId);

    const targetMembership = await this.prisma.teamMembership.findFirst({
      where: { userId: targetUserId, teamId: membership.teamId, status: MembershipStatus.ACTIVE },
    });
    if (!targetMembership) {
      throw new BadRequestException('Pracownik nie jest członkiem zespołu.');
    }

    // Verify all positions belong to this team
    const positions = await this.prisma.position.findMany({
      where: { id: { in: positionIds }, teamId: membership.teamId },
    });
    if (positions.length !== positionIds.length) {
      throw new BadRequestException('Niektóre stanowiska nie istnieją.');
    }

    // Replace all assignments atomically
    await this.prisma.$transaction([
      this.prisma.employeePosition.deleteMany({ where: { userId: targetUserId } }),
      ...positionIds.map((positionId) =>
        this.prisma.employeePosition.create({
          data: { userId: targetUserId, positionId },
        }),
      ),
    ]);

    return this.getEmployeePositions(userId, targetUserId);
  }

  async getEmployeePositions(requesterId: string, targetUserId: string) {
    const membership = await this.requireMember(requesterId);
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { teamId: true },
    });
    if (!targetUser || targetUser.teamId !== membership.teamId) {
      throw new ForbiddenException('Brak dostępu do stanowisk tego pracownika.');
    }
    return this.prisma.employeePosition.findMany({
      where: { userId: targetUserId },
      include: { position: true },
    });
  }

  /** One-time: auto-create positions from existing shift roleNames and link them */
  async migrateFromRoleNames(userId: string) {
    const membership = await this.requireManager(userId);
    const teamId = membership.teamId;

    const shifts = await this.prisma.shift.findMany({
      where: { teamId, positionId: null },
      select: { id: true, roleName: true },
    });

    const uniqueNames = [...new Set(shifts.map((s) => s.roleName).filter(Boolean))];
    let created = 0;
    let linked = 0;

    const colors = [
      '#8FACDB', '#FF8400', '#6B8E23', '#E74C3C', '#9B59B6',
      '#1ABC9C', '#F39C12', '#3498DB', '#E67E22', '#2ECC71',
    ];

    for (let i = 0; i < uniqueNames.length; i++) {
      const name = uniqueNames[i];
      let position = await this.prisma.position.findUnique({
        where: { teamId_name: { teamId, name } },
      });
      if (!position) {
        position = await this.prisma.position.create({
          data: { teamId, name, color: colors[i % colors.length] },
        });
        created++;
      }
      const count = await this.prisma.shift.updateMany({
        where: { teamId, roleName: name, positionId: null },
        data: { positionId: position.id },
      });
      linked += count.count;
    }

    return { created, linked, uniqueNames };
  }
}
