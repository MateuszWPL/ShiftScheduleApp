import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser, CurrentUser as User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateShiftDto } from './dto/create-shift.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SyncUserDto } from './dto/sync-user.dto';
import { ShiftIdParamDto, TargetIdParamDto, MembershipIdParamDto } from './dto/params.dto';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @SkipThrottle()
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.shiftsService.findAll(user.userId);
  }

  @Post()
  create(@Body() createShiftDto: CreateShiftDto, @CurrentUser() user: User) {
    return this.shiftsService.create(user.userId, {
      startTime: new Date(createShiftDto.startTime),
      endTime: new Date(createShiftDto.endTime),
      roleName: createShiftDto.roleName,
      status: createShiftDto.status,
    });
  }

  @Post(':id/claim')
  claim(@Param() params: ShiftIdParamDto, @CurrentUser() user: User) {
    return this.shiftsService.claimShift(params.id, user.userId);
  }

  @Patch(':id/release')
  release(@Param() params: ShiftIdParamDto, @CurrentUser() user: User) {
    return this.shiftsService.releaseShift(params.id, user.userId);
  }

  @SkipThrottle()
  @Get('users/all')
  getAllUsers() {
    return this.shiftsService.getAllUsers();
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('users/sync')
  async syncUser(@Query() query: SyncUserDto) {
    return this.shiftsService.syncUserByEmail(query.email, query.name || '');
  }

  @Post('teams')
  createTeam(@Body() createTeamDto: CreateTeamDto, @CurrentUser() user: User) {
    return this.shiftsService.createTeam(user.userId, createTeamDto.name);
  }

  @Post('teams/join')
  joinTeam(@Body() joinTeamDto: JoinTeamDto, @CurrentUser() user: User) {
    return this.shiftsService.joinTeam(user.userId, joinTeamDto.code);
  }

  @SkipThrottle()
  @Get('teams/pending')
  getPending(@CurrentUser() user: User) {
    return this.shiftsService.getPendingMembers(user.userId);
  }

  @Post('teams/pending/:membershipId/approve')
  approvePending(@Param() params: MembershipIdParamDto, @CurrentUser() user: User) {
    return this.shiftsService.approveMember(user.userId, params.membershipId);
  }

  @Post('teams/pending/:membershipId/reject')
  rejectPending(@Param() params: MembershipIdParamDto, @CurrentUser() user: User) {
    return this.shiftsService.rejectMember(user.userId, params.membershipId);
  }

  @SkipThrottle()
  @Get('team/members')
  getTeamMembers(@CurrentUser() user: User) {
    return this.shiftsService.getTeamMembers(user.userId);
  }

  @SkipThrottle()
  @Get('teams/my-membership')
  getMyMembershipStatus(@CurrentUser() user: User) {
    return this.shiftsService.getMyMembershipStatus(user.userId);
  }

  @Patch('users/me')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto, @CurrentUser() user: User) {
    return this.shiftsService.updateProfile(user.userId, {
      name: updateProfileDto.name,
      phoneNumber: updateProfileDto.phoneNumber,
    });
  }

  @Patch('teams/members/:targetId')
  updateEmployee(
    @Param() params: TargetIdParamDto,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() user: User
  ) {
    return this.shiftsService.updateEmployee(user.userId, params.targetId, {
      name: updateEmployeeDto.name,
      nickname: updateEmployeeDto.nickname,
      hourlyRate: updateEmployeeDto.hourlyRate,
      maxHours: updateEmployeeDto.maxHours,
      skills: updateEmployeeDto.skills,
      notes: updateEmployeeDto.notes,
    });
  }
}