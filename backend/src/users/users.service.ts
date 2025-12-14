import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShadowProfileDto } from './dto/create-shadow-profile.dto';
import { PublicUserDto, PrivateUserDto } from './dto/user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createShadowProfile(teamId: string, createDto: CreateShadowProfileDto) {
    return this.prisma.user.create({
      data: {
        name: createDto.name,
        hourlyRate: createDto.hourlyRate,
        maxHours: createDto.maxHours,
        phoneNumber: createDto.phoneNumber,
        status: 'UNCLAIMED',
        role: 'EMPLOYEE',
        teamId: teamId,
      } as any,
    });
  }

  async findAll(teamId: string, userRole: string): Promise<PublicUserDto[] | PrivateUserDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        teamId: teamId,
      },
    });

    // Jeśli użytkownik jest OWNER lub MANAGER, zwróć pełne dane
    if (userRole === 'OWNER' || userRole === 'MANAGER') {
      return users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status || 'ACTIVE',
        hourlyRate: user.hourlyRate ? Number(user.hourlyRate) : null,
        phoneNumber: user.phoneNumber,
        maxHours: user.maxHours,
        skills: user.skills,
        avatarUrl: user.avatarUrl,
      }));
    }

    // Dla zwykłych pracowników - tylko dane publiczne
    return users.map((user: any) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      status: user.status || 'ACTIVE',
      skills: user.skills,
      avatarUrl: user.avatarUrl,
    }));
  }

  async findOne(userId: string, requesterRole: string, requesterTeamId: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Użytkownik nie został znaleziony');
    }

    // Sprawdź czy użytkownik należy do tego samego teamu
    if (user.teamId !== requesterTeamId) {
      throw new ForbiddenException('Brak dostępu do tego użytkownika');
    }

    // Jeśli requester jest OWNER lub MANAGER, zwróć pełne dane
    if (requesterRole === 'OWNER' || requesterRole === 'MANAGER') {
      const u = user as any;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status || 'ACTIVE',
        hourlyRate: u.hourlyRate ? Number(u.hourlyRate) : null,
        phoneNumber: u.phoneNumber,
        maxHours: u.maxHours,
        skills: u.skills,
        avatarUrl: u.avatarUrl,
      };
    }

    // Dla zwykłych pracowników - tylko dane publiczne
    const u = user as any;
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      status: u.status || 'ACTIVE',
      skills: u.skills,
      avatarUrl: u.avatarUrl,
    };
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const updateData: any = {};
    
    if (updateDto.phoneNumber !== undefined) {
      updateData.phoneNumber = updateDto.phoneNumber || null;
    }
    
    if (updateDto.avatarUrl !== undefined) {
      updateData.avatarUrl = updateDto.avatarUrl || null;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: (user as any).status || 'ACTIVE',
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      skills: user.skills,
      hourlyRate: user.hourlyRate ? Number(user.hourlyRate) : null,
      maxHours: user.maxHours,
    };
  }
}

