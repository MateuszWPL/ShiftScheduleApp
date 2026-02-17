import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser, CurrentUser as User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateShiftDto } from './dto/create-shift.dto';
import { AddAssignmentDto } from './dto/add-assignment.dto';
import { ListShiftsQueryDto } from './dto/list-shifts-query.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SyncUserDto } from './dto/sync-user.dto';
import { PublishShiftsDto } from './dto/publish-shifts.dto';
import {
  ShiftIdParamDto,
  TargetIdParamDto,
  MembershipIdParamDto,
  AssignmentIdParamDto,
} from './dto/params.dto';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @SkipThrottle()
  @Get()
  findAll(@CurrentUser() user: User, @Query() query: ListShiftsQueryDto) {
    return this.shiftsService.findAll(user.userId, {
      from: query.from,
      to: query.to,
    });
  }

  /** Pozycje na giełdzie (do przejęcia). */
  @SkipThrottle()
  @Get('marketplace')
  getMarketplace(@CurrentUser() user: User) {
    return this.shiftsService.getMarketplace(user.userId);
  }

  @SkipThrottle()
  @Get(':id')
  findOne(@Param() params: ShiftIdParamDto, @CurrentUser() user: User) {
    return this.shiftsService.findOne(user.userId, params.id);
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

  @Patch(':id')
  updateShift(
    @Param() params: ShiftIdParamDto,
    @Body() body: UpdateShiftDto,
    @CurrentUser() user: User,
  ) {
    return this.shiftsService.updateShift(user.userId, params.id, {
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      roleName: body.roleName,
      status: body.status,
    });
  }

  @Delete(':id')
  deleteShift(
    @Param() params: ShiftIdParamDto,
    @CurrentUser() user: User,
  ) {
    return this.shiftsService.deleteShift(user.userId, params.id);
  }

  /** Publikacja zmian (DRAFT → PUBLISHED). */
  @Post('publish')
  publishShifts(@Body() body: PublishShiftsDto, @CurrentUser() user: User) {
    return this.shiftsService.publishShifts(user.userId, {
      shiftIds: body.shiftIds,
      from: body.from,
      to: body.to,
    });
  }

  /** Walidacja przypisania pracownika (dostępność, konflikty, doba pracownicza). */
  @SkipThrottle()
  @Get(':id/validate-assignment/:userId')
  validateAssignment(
    @Param('id') shiftId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.shiftsService.validateAssignmentForShift(user.userId, shiftId, targetUserId);
  }

  /** Dodanie pozycji do zmiany (Owner/Manager): przypisanie użytkownika lub wolna pozycja. */
  @Post(':id/assignments')
  addAssignment(
    @Param() params: ShiftIdParamDto,
    @Body() body: AddAssignmentDto,
    @CurrentUser() user: User,
  ) {
    return this.shiftsService.addAssignment(user.userId, params.id, {
      userId: body.userId ?? undefined,
      isUpForGrabs: body.isUpForGrabs,
    });
  }

  @Patch('assignments/:assignmentId')
  updateAssignment(
    @Param() params: AssignmentIdParamDto,
    @Body() body: AddAssignmentDto,
    @CurrentUser() user: User,
  ) {
    return this.shiftsService.updateAssignment(user.userId, params.assignmentId, {
      userId: body.userId,
      isUpForGrabs: body.isUpForGrabs,
    });
  }

  @Delete('assignments/:assignmentId')
  removeAssignment(
    @Param() params: AssignmentIdParamDto,
    @CurrentUser() user: User,
  ) {
    return this.shiftsService.removeAssignment(user.userId, params.assignmentId);
  }

  @Post('assignments/:assignmentId/claim')
  claimAssignment(
    @Param() params: AssignmentIdParamDto,
    @CurrentUser() user: User,
  ) {
    return this.shiftsService.claimAssignment(params.assignmentId, user.userId);
  }

  @Patch('assignments/:assignmentId/release')
  releaseAssignment(
    @Param() params: AssignmentIdParamDto,
    @CurrentUser() user: User,
  ) {
    return this.shiftsService.releaseAssignment(params.assignmentId, user.userId);
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