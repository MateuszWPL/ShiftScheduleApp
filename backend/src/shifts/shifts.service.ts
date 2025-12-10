import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { MembershipStatus, Role, Shift, ShiftStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(userId: string) {
    const activeMembership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
      include: { team: true },
    });

    if (!activeMembership) {
      // Brak aktywnego członkostwa => brak danych
      return [];
    }

    return this.prisma.shift.findMany({
      where: {
        teamId: activeMembership.teamId,
      },
      include: { user: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async create(
    userId: string,
    data: { startTime: Date; endTime: Date; roleName: string; status?: ShiftStatus },
  ) {
    // 1. Sprawdź aktywne członkostwo
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });

    if (!membership) {
      throw new BadRequestException('Musisz należeć do zespołu (ACTIVE), żeby tworzyć zmiany.');
    }

    return this.prisma.shift.create({
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        roleName: data.roleName,
        status: data.status ?? ShiftStatus.DRAFT,
        teamId: membership.teamId,
        userId: null,
        isUpForGrabs: false,
      },
      include: { user: true },
    });
  }

  getAllUsers() {
    return this.prisma.user.findMany();
  }
  

  async claimShift(shiftId: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Sprawdź aktywne członkostwo w tym samym zespole
        const membership = await tx.teamMembership.findFirst({
          where: { userId, status: MembershipStatus.ACTIVE },
        });

        if (!membership) {
          throw new ForbiddenException('Brak aktywnego członkostwa w zespole.');
        }

        // Blokada rekordu zmiany – SELECT FOR UPDATE
        const rawShifts = await tx.$queryRaw<Shift[]>`
          SELECT * FROM "Shift"
          WHERE "id" = ${shiftId}
          FOR UPDATE
        `;

        const shift = rawShifts[0];

        if (!shift) {
          throw new NotFoundException('Zmiana nie istnieje.');
        }

        if (shift.teamId !== membership.teamId) {
          throw new ForbiddenException('Nie możesz przejąć zmiany z innego zespołu.');
        }

        const isAvailable = (shift as any).isUpForGrabs ?? (shift as any).isupforgrabs;

        if (!isAvailable) {
          throw new BadRequestException('Ta zmiana nie jest dostępna na giełdzie.');
        }

        return tx.shift.update({
          where: { id: shiftId },
          data: {
            isUpForGrabs: false,
            userId,
          },
        });
      });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }
  async releaseShift(shiftId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const rawShifts = await tx.$queryRaw<Shift[]>`
        SELECT * FROM "Shift"
        WHERE "id" = ${shiftId}
        FOR UPDATE
      `;

      const shift = rawShifts[0];

      if (!shift) {
        throw new NotFoundException('Zmiana nie istnieje.');
      }

      if (shift.userId !== userId) {
        throw new BadRequestException('Nie możesz oddać cudzej zmiany!');
      }

      return tx.shift.update({
        where: { id: shiftId },
        data: {
          isUpForGrabs: true, // Flaga giełdy, userId zostaje do czasu przejęcia
        },
      });
    });
  }
  // Backend: src/shifts/shifts.service.ts

  async syncUserByEmail(email: string, name: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { team: true },
    });

    if (!user) {
      // Tylko dla Google OAuth - użytkownicy email+hasło są tworzeni przez /auth/register
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          role: 'EMPLOYEE', // Domyślna rola
          provider: 'google', // Google OAuth
          // teamId: ... (tutaj w przyszłości przypiszemy do teamu)
        },
        include: { team: true },
      });
    } else {
      // Aktualizuj tylko name jeśli użytkownik już istnieje (dla Google OAuth)
      // Nie nadpisujemy hasła ani innych pól dla użytkowników email+hasło
      if (!user.password && name) {
        // Tylko dla Google OAuth - aktualizuj name
        user = await this.prisma.user.update({
          where: { email },
          data: { name },
          include: { team: true },
        });
      }
    }
    return user;
  }

  async createTeam(userId: string, teamName: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Stwórz Team z 12-znakowym kodem nanoid
      const inviteCode = nanoid(12);
      const team = await tx.team.create({
        data: { 
          name: teamName,
          inviteCode: inviteCode,
        },
      });

      // 2. Członkostwo OWNER (ACTIVE)
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

      // 3. Zaktualizuj Usera (przypisz do teamu i roli OWNER)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          teamId: team.id,
          role: Role.OWNER,
        },
        include: { team: true },
      });

      return { team, user: updatedUser };
    });
  }
  async joinTeam(userId: string, code: string) {
    const team = await this.prisma.team.findUnique({
      where: { inviteCode: code },
    });

    if (!team) {
      throw new BadRequestException('Nieprawidłowy kod zespołu.');
    }

    // Pobierz dane użytkownika zgłaszającego się
    const applicant = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!applicant) {
      throw new NotFoundException('Użytkownik nie istnieje.');
    }

    // Sprawdź istniejące członkostwo
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

    // Jeśli istnieje rekord z statusem REJECTED lub LEFT, zaktualizuj go na PENDING
    // zamiast tworzyć nowy (unikamy unique constraint error)
    if (existing) {
      await this.prisma.teamMembership.update({
        where: {
          userId_teamId: { userId, teamId: team.id },
        },
        data: {
          status: MembershipStatus.PENDING,
          requestedAt: new Date(), // Zaktualizuj datę zgłoszenia
        },
      });
    } else {
      // Utwórz nowe zgłoszenie PENDING (tylko jeśli nie ma istniejącego rekordu)
      await this.prisma.teamMembership.create({
        data: {
          userId,
          teamId: team.id,
          status: MembershipStatus.PENDING,
          role: Role.EMPLOYEE,
        },
      });
    }

    // Wyślij powiadomienia do wszystkich OWNER i MANAGER w zespole
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

    // Wyślij powiadomienia asynchronicznie (nie blokujemy odpowiedzi)
    managers.forEach((membership) => {
      this.emailService
        .sendJoinRequestNotification(
          membership.user.email,
          membership.user.name || 'Menedżerze',
          applicant.name || 'Użytkownik',
          applicant.email,
          team.name,
        )
        .catch((error) => {
          // Logowanie błędów już jest w EmailService
        });
    });

    return { status: MembershipStatus.PENDING, team };
  }
  async getMyMembershipStatus(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId },
      orderBy: { requestedAt: 'desc' }, // Najnowsze członkostwo
    });

    if (!membership) {
      // Jeśli brak membership, sprawdź czy user ma teamId (stare konta)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });
      // Jeśli ma teamId ale brak membership, zakładamy ACTIVE (stare konta)
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
          },
        },
      },
    });

    return members.map((m) => m.user);
  }
  async updateProfile(userId: string, data: { name?: string; phoneNumber?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
      },
    });
  }
  async updateEmployee(requesterId: string, targetUserId: string, data: { skills?: string[] }) {
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

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        skills: data.skills,
      },
    });
  }

  // ---- PENDING LIST + APPROVAL ----
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

      // Ustaw teamId na użytkowniku (obecny model zakłada jedno aktywne członkostwo)
      await tx.user.update({
        where: { id: membership.userId },
        data: {
          teamId: membership.teamId,
          role: membership.role ?? Role.EMPLOYEE,
        },
      });

      return updatedMembership;
    });

    // Wyślij powiadomienie do zaakceptowanego użytkownika
    this.emailService
      .sendMembershipApprovedNotification(
        membership.user.email,
        membership.user.name || 'Użytkowniku',
        membership.team.name,
      )
      .catch((error) => {
        // Logowanie błędów już jest w EmailService
      });

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

    // Wyślij powiadomienie do odrzuconego użytkownika
    this.emailService
      .sendMembershipRejectedNotification(
        membership.user.email,
        membership.user.name || 'Użytkowniku',
        membership.team.name,
      )
      .catch((error) => {
        // Logowanie błędów już jest w EmailService
      });

    return result;
  }
}