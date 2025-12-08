import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Shift } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    // 1. Pobierz usera, żeby sprawdzić jego Team
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.teamId) {
      // Jeśli user nie ma teamu, nie widzi żadnych zmian (bezpieczny default)
      return [];
    }

    // 2. Pobierz zmiany TYLKO dla tego teamu
    return this.prisma.shift.findMany({
      where: {
        teamId: user.teamId, // <--- KLUCZOWA LINIA (Multi-tenancy)
      },
      include: { user: true },
      orderBy: { startTime: 'asc' }, // Przy okazji posortujmy
    });
  }

  async create(userId: string, data: { startTime: Date; endTime: Date; roleName: string; status?: string }) {
    // 1. Pobierz usera, żeby sprawdzić jego Team
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user || !user.teamId) {
      throw new BadRequestException('Musisz należeć do zespołu, żeby tworzyć zmiany.');
    }

    // 2. Stwórz zmianę dla tego teamu
    return this.prisma.shift.create({
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        roleName: data.roleName,
        status: (data.status as any) || 'DRAFT',
        teamId: user.teamId,
        userId: null, // Zmiana nieobsadzona na start
        isUpForGrabs: false, // Nie na giełdzie na start
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
        console.log(`[DEBUG] Próba zablokowania zmiany: ${shiftId} dla usera: ${userId}`);

        // KROK A: SELECT FOR UPDATE
        // POPRAWKA: Usunięto "::uuid". Porównujemy String do Stringa.
        const rawShifts = await tx.$queryRaw<any[]>`
          SELECT * FROM "Shift" 
          WHERE "id" = ${shiftId} 
          FOR UPDATE
        `;

        console.log('[DEBUG] Wynik zapytania RAW:', rawShifts[0]);

        const shift = rawShifts[0];

        if (!shift) {
          throw new NotFoundException('Zmiana nie istnieje (RAW query zwróciło pusto).');
        }

        // Obsługa różnej wielkości liter w wynikach Postgresa
        const isAvailable = shift.isUpForGrabs ?? shift.isupforgrabs;

        if (!isAvailable) {
           throw new BadRequestException('Ta zmiana nie jest dostępna na giełdzie.');
        }

        // KROK C: Aktualizacja
        const updatedShift = await tx.shift.update({
          where: { id: shiftId },
          data: {
            isUpForGrabs: false,
            userId: userId,
          },
        });

        console.log('[DEBUG] Sukces!');
        return updatedShift;
      });
    } catch (error) {
      console.error('[CRITICAL ERROR] Wystąpił błąd w transakcji:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }
  async releaseShift(shiftId: string, userId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Zmiana nie istnieje.');
    }

    // Walidacja: Czy to Twoja zmiana?
    if (shift.userId !== userId) {
      throw new BadRequestException('Nie możesz oddać cudzej zmiany!');
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        isUpForGrabs: true, // Wystawiamy flagę
        // UWAGA: Nie zerujemy userId. Nadal jesteś właścicielem, dopóki ktoś nie weźmie.
      },
    });
  }
  // Backend: src/shifts/shifts.service.ts

  async syncUserByEmail(email: string, name: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { team: true },
    });

    if (!user) {
      console.log(`[AUTH] Tworzę nowego usera dla: ${email}`);
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          role: 'EMPLOYEE', // Domyślna rola
          // teamId: ... (tutaj w przyszłości przypiszemy do teamu)
        },
        include: { team: true },
      });
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

      // 2. Zaktualizuj Usera (przypisz do teamu i daj władzę)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          teamId: team.id,
          role: 'OWNER', // Pierwszy user jest szefem
        },
        include: { team: true }, // Include team relation so frontend can access inviteCode
      });

      return { team, user: updatedUser };
    });
  }
  async joinTeam(userId: string, code: string) {
    // 1. Znajdź team po kodzie
    const team = await this.prisma.team.findUnique({
      where: { inviteCode: code },
    });

    if (!team) {
      throw new BadRequestException('Nieprawidłowy kod zespołu.');
    }

    // 2. Przypisz usera do teamu
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        teamId: team.id,
        role: 'EMPLOYEE', // Domyślnie pracownik
      },
      include: { team: true }, // Include team relation for consistency
    });
  }
  async getTeamMembers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user || !user.teamId) {
      throw new BadRequestException('Nie należysz do żadnego zespołu.');
    }

    // Pobierz wszystkich z tym samym teamId
    return this.prisma.user.findMany({
      where: { teamId: user.teamId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        skills: true,
        // Nie pobieramy haseł ani innych wrażliwych danych!
      },
    });
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
    // 1. Sprawdź kim jest ten, kto prosi (Requester)
    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
    
    // 2. Sprawdź kim jest ofiara edycji (Target)
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });

    if (!requester || !target) throw new BadRequestException("Nie znaleziono użytkownika");

    // 3. Walidacja B2B (Security)
    if (requester.teamId !== target.teamId) {
      throw new BadRequestException("Nie możesz edytować kogoś z innej firmy!");
    }
    if (requester.role !== 'OWNER' && requester.role !== 'MANAGER') {
      throw new BadRequestException("Brak uprawnień. Tylko Owner/Manager może to robić.");
    }

    // 4. Update
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        skills: data.skills, // Nadpisujemy tablicę umiejętności
      },
    });
  }
}