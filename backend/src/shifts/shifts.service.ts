import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { MembershipStatus, Role, ShiftStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /** Lista zmian zespołu (grafik). Opcjonalny filtr dat from/to. */
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

    const where: {
      teamId: string;
      startTime?: { lte?: Date };
      endTime?: { gte?: Date };
    } = {
      teamId: activeMembership.teamId,
    };
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
        assignments: {
          include: { user: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });
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
    data: { startTime?: Date; endTime?: Date; roleName?: string; status?: ShiftStatus },
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
    const updateData: { startTime?: Date; endTime?: Date; roleName?: string; status?: ShiftStatus } = {};
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.roleName !== undefined) updateData.roleName = data.roleName;
    if (data.status !== undefined) updateData.status = data.status;
    return this.prisma.shift.update({
      where: { id: shiftId },
      data: updateData,
      include: { assignments: { include: { user: true } } },
    });
  }

  /** Tworzenie zmiany (bez przypisań). Przypisania dodaje się przez addAssignment. */
  async create(
    userId: string,
    data: { startTime: Date; endTime: Date; roleName: string; status?: ShiftStatus },
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

    return this.prisma.shift.create({
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        roleName: data.roleName,
        status: data.status ?? ShiftStatus.DRAFT,
        teamId: membership.teamId,
      },
      include: {
        assignments: { include: { user: true } },
      },
    });
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

    return this.prisma.shiftAssignment.create({
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

  /** Lista pozycji na giełdzie (assignments z isUpForGrabs). */
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
        shift: { teamId: membership.teamId },
      },
      include: {
        shift: true,
        user: true,
      },
      orderBy: { shift: { startTime: 'asc' } },
    });
  }

  getAllUsers() {
    return this.prisma.user.findMany({
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
  

  /** Przejęcie pozycji z giełdy (pessimistic lock). */
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
          select: { teamId: true },
        });
        if (!shift || shift.teamId !== membership.teamId) {
          throw new ForbiddenException('Nie możesz przejąć pozycji z innego zespołu.');
        }
        if (!assignment.isUpForGrabs) {
          throw new BadRequestException('Ta pozycja nie jest dostępna na giełdzie.');
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

  async syncUserByEmail(email: string, name: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { team: true },
    });

    if (!user) {
      // Tworzenie nowego użytkownika - używamy nazwy z Google
      user = await this.prisma.user.create({
        data: {
          email,
          name,
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
          },
        },
      },
    });

    return members.map((m) => m.user);
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