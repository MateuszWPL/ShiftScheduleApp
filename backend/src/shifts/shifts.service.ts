import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Shift } from '@prisma/client';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.shift.findMany({
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
}