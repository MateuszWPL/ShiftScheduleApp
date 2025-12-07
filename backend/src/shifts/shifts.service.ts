import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Shift } from '@prisma/client';

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
      });
    }
    return user;
  }
  async createTeam(userId: string, teamName: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Stwórz Team
      const team = await tx.team.create({
        data: { name: teamName },
      });

      // 2. Zaktualizuj Usera (przypisz do teamu i daj władzę)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          teamId: team.id,
          role: 'OWNER', // Pierwszy user jest szefem
        },
      });

      return { team, user: updatedUser };
    });
  }
}