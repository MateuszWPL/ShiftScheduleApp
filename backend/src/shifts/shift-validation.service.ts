import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Minimum rest between shifts (Kodeks Pracy: 11h odpoczynku dobowego). */
const MIN_REST_HOURS = 11;
const MIN_REST_MS = MIN_REST_HOURS * 60 * 60 * 1000;

export interface ShiftValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

@Injectable()
export class ShiftValidationService {
  private readonly logger = new Logger(ShiftValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates a shift assignment against business rules:
   * 1. Availability: Is the employee available during that time?
   * 2. Conflicts: Does the employee already have a shift at that time?
   * 3. Rest period: Does the employee have at least 11h rest (Kodeks Pracy)?
   */
  async validateAssignment(
    userId: string,
    teamId: string,
    shiftStartTime: Date,
    shiftEndTime: Date,
    excludeShiftId?: string,
  ): Promise<ShiftValidationResult> {
    const result: ShiftValidationResult = {
      valid: true,
      warnings: [],
      errors: [],
    };

    await Promise.all([
      this.checkAvailability(userId, teamId, shiftStartTime, shiftEndTime, result),
      this.checkConflicts(userId, teamId, shiftStartTime, shiftEndTime, excludeShiftId, result),
      this.checkRestPeriod(userId, teamId, shiftStartTime, shiftEndTime, excludeShiftId, result),
    ]);

    return result;
  }

  /**
   * Check if the employee has declared availability covering the shift time.
   * This is a warning (not blocking) - manager may override.
   */
  private async checkAvailability(
    userId: string,
    teamId: string,
    shiftStart: Date,
    shiftEnd: Date,
    result: ShiftValidationResult,
  ): Promise<void> {
    const availabilitySlots = await this.prisma.availabilitySlot.findMany({
      where: {
        userId,
        teamId,
        startDateTime: { lte: shiftStart },
        endDateTime: { gte: shiftEnd },
      },
    });

    if (availabilitySlots.length === 0) {
      result.warnings.push(
        `Pracownik nie zgłosił dostępności na ten termin (${shiftStart.toLocaleDateString('pl-PL')} ${shiftStart.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}–${shiftEnd.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}).`,
      );
    }
  }

  /**
   * Check if the employee already has another shift overlapping this time.
   * This is an error (blocking).
   */
  private async checkConflicts(
    userId: string,
    teamId: string,
    shiftStart: Date,
    shiftEnd: Date,
    excludeShiftId: string | undefined,
    result: ShiftValidationResult,
  ): Promise<void> {
    const conflicting = await this.prisma.shiftAssignment.findMany({
      where: {
        userId,
        shift: {
          teamId,
          id: excludeShiftId ? { not: excludeShiftId } : undefined,
          startTime: { lt: shiftEnd },
          endTime: { gt: shiftStart },
        },
      },
      include: {
        shift: {
          select: { startTime: true, endTime: true, roleName: true },
        },
      },
    });

    if (conflicting.length > 0) {
      const conflicts = conflicting.map((c) => {
        const s = c.shift;
        return `${s.roleName} (${new Date(s.startTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}–${new Date(s.endTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })})`;
      });
      result.valid = false;
      result.errors.push(
        `Konflikt: pracownik ma już zmianę w tym czasie: ${conflicts.join(', ')}.`,
      );
    }
  }

  /**
   * Check 11h rest period between shifts (Kodeks Pracy - doba pracownicza).
   * Looks at adjacent shifts to ensure minimum 11h gap.
   */
  private async checkRestPeriod(
    userId: string,
    teamId: string,
    shiftStart: Date,
    shiftEnd: Date,
    excludeShiftId: string | undefined,
    result: ShiftValidationResult,
  ): Promise<void> {
    const windowStart = new Date(shiftStart.getTime() - MIN_REST_MS);
    const windowEnd = new Date(shiftEnd.getTime() + MIN_REST_MS);

    const nearbyAssignments = await this.prisma.shiftAssignment.findMany({
      where: {
        userId,
        shift: {
          teamId,
          id: excludeShiftId ? { not: excludeShiftId } : undefined,
          OR: [
            { endTime: { gt: windowStart, lte: shiftStart } },
            { startTime: { gte: shiftEnd, lt: windowEnd } },
          ],
        },
      },
      include: {
        shift: {
          select: { startTime: true, endTime: true, roleName: true },
        },
      },
    });

    for (const assignment of nearbyAssignments) {
      const otherShift = assignment.shift;
      const otherEnd = new Date(otherShift.endTime);
      const otherStart = new Date(otherShift.startTime);

      let restGapMs: number;
      let direction: string;

      if (otherEnd.getTime() <= shiftStart.getTime()) {
        restGapMs = shiftStart.getTime() - otherEnd.getTime();
        direction = 'po poprzedniej zmianie';
      } else {
        restGapMs = otherStart.getTime() - shiftEnd.getTime();
        direction = 'przed następną zmianą';
      }

      const restGapHours = restGapMs / (60 * 60 * 1000);

      if (restGapHours < MIN_REST_HOURS) {
        result.warnings.push(
          `Naruszenie doby pracowniczej: tylko ${restGapHours.toFixed(1)}h odpoczynku ${direction} ` +
          `(${otherShift.roleName} ${new Date(otherShift.startTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}–` +
          `${new Date(otherShift.endTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}). ` +
          `Wymagane minimum ${MIN_REST_HOURS}h.`,
        );
      }
    }
  }

  /**
   * Batch validate multiple user assignments for a shift.
   * Useful when publishing draft shifts.
   */
  async validateShiftForPublish(
    shiftId: string,
    teamId: string,
    shiftStart: Date,
    shiftEnd: Date,
  ): Promise<{ userId: string; userName: string; result: ShiftValidationResult }[]> {
    const assignments = await this.prisma.shiftAssignment.findMany({
      where: { shiftId, userId: { not: null } },
      include: {
        user: { select: { id: true, name: true, nickname: true } },
      },
    });

    const results: { userId: string; userName: string; result: ShiftValidationResult }[] = [];

    for (const assignment of assignments) {
      if (!assignment.userId || !assignment.user) continue;

      const validationResult = await this.validateAssignment(
        assignment.userId,
        teamId,
        shiftStart,
        shiftEnd,
        shiftId,
      );

      results.push({
        userId: assignment.userId,
        userName: assignment.user.nickname || assignment.user.name,
        result: validationResult,
      });
    }

    return results;
  }
}
