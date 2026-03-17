import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, Role } from '@prisma/client';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireMember(userId: string) {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) throw new BadRequestException('Brak aktywnego zespołu.');
    return membership;
  }

  private async requireManager(userId: string) {
    const membership = await this.requireMember(userId);
    if (membership.role !== Role.OWNER && membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Tylko Owner/Manager może zarządzać lokalizacjami.');
    }
    return membership;
  }

  async getLocations(userId: string) {
    const membership = await this.requireMember(userId);
    return this.prisma.location.findMany({
      where: { teamId: membership.teamId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async createLocation(userId: string, dto: CreateLocationDto) {
    const membership = await this.requireManager(userId);

    const existing = await this.prisma.location.findUnique({
      where: { teamId_name: { teamId: membership.teamId, name: dto.name } },
    });
    if (existing) {
      throw new BadRequestException(`Lokalizacja "${dto.name}" już istnieje.`);
    }

    const count = await this.prisma.location.count({
      where: { teamId: membership.teamId },
    });

    return this.prisma.location.create({
      data: {
        teamId: membership.teamId,
        name: dto.name,
        address: dto.address,
        isDefault: count === 0,
      },
    });
  }

  async updateLocation(userId: string, locationId: string, dto: UpdateLocationDto) {
    const membership = await this.requireManager(userId);

    const location = await this.prisma.location.findFirst({
      where: { id: locationId, teamId: membership.teamId },
    });
    if (!location) throw new NotFoundException('Lokalizacja nie istnieje.');

    if (dto.name && dto.name !== location.name) {
      const duplicate = await this.prisma.location.findUnique({
        where: { teamId_name: { teamId: membership.teamId, name: dto.name } },
      });
      if (duplicate) {
        throw new BadRequestException(`Lokalizacja "${dto.name}" już istnieje.`);
      }
    }

    return this.prisma.location.update({
      where: { id: locationId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address }),
      },
    });
  }

  async deleteLocation(userId: string, locationId: string) {
    const membership = await this.requireManager(userId);

    const location = await this.prisma.location.findFirst({
      where: { id: locationId, teamId: membership.teamId },
    });
    if (!location) throw new NotFoundException('Lokalizacja nie istnieje.');

    if (location.isDefault) {
      throw new BadRequestException('Nie można usunąć domyślnej lokalizacji.');
    }

    await this.prisma.location.delete({ where: { id: locationId } });
    return { deleted: true };
  }

  async setDefaultLocation(userId: string, locationId: string) {
    const membership = await this.requireManager(userId);

    const location = await this.prisma.location.findFirst({
      where: { id: locationId, teamId: membership.teamId },
    });
    if (!location) throw new NotFoundException('Lokalizacja nie istnieje.');

    await this.prisma.$transaction([
      this.prisma.location.updateMany({
        where: { teamId: membership.teamId },
        data: { isDefault: false },
      }),
      this.prisma.location.update({
        where: { id: locationId },
        data: { isDefault: true },
      }),
    ]);

    return this.prisma.location.findUnique({ where: { id: locationId } });
  }
}
