import { Controller, Get, Post, Body, Param, Patch, UseGuards, BadRequestException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUser as CurrentUserType } from '../auth/decorators/user.decorator';
import { CreateShadowProfileDto } from './dto/create-shadow-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('shadow-profile')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  async createShadowProfile(
    @Body() createDto: CreateShadowProfileDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!user.teamId) {
      throw new BadRequestException('Użytkownik musi należeć do zespołu');
    }
    return this.usersService.createShadowProfile(user.teamId, createDto);
  }

  @SkipThrottle()
  @Get()
  async findAll(@CurrentUser() user: CurrentUserType) {
    if (!user.teamId) {
      throw new BadRequestException('Użytkownik musi należeć do zespołu');
    }
    return this.usersService.findAll(user.teamId, user.role);
  }

  @SkipThrottle()
  @Get('me')
  async getMyProfile(@CurrentUser() user: CurrentUserType) {
    return this.usersService.findOne(user.userId, user.role, user.teamId);
  }

  @Patch('me')
  async updateMyProfile(
    @Body() updateDto: UpdateProfileDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.usersService.updateProfile(user.userId, updateDto);
  }

  @SkipThrottle()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.usersService.findOne(id, user.role, user.teamId);
  }
}

