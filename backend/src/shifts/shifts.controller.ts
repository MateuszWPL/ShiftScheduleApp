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
@UseGuards(JwtAuthGuard) // Wszystkie endpointy wymagają autentykacji
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @SkipThrottle() // GET endpointy są bezpieczne (autentykowane) i często używane
  @Get()
  findAll(@CurrentUser() user: User) {
    // userId jest teraz z tokena, nie z query - BEZPIECZNIE
    return this.shiftsService.findAll(user.userId);
  }

  @Post()
  create(@Body() createShiftDto: CreateShiftDto, @CurrentUser() user: User) {
    // userId i teamId z tokena - BEZPIECZNIE
    return this.shiftsService.create(user.userId, {
      startTime: new Date(createShiftDto.startTime),
      endTime: new Date(createShiftDto.endTime),
      roleName: createShiftDto.roleName,
      status: createShiftDto.status,
    });
  }

  @Post(':id/claim')
  claim(@Param() params: ShiftIdParamDto, @CurrentUser() user: User) {
    // userId z tokena, nie z body - BEZPIECZNIE
    // UUID walidowany przez DTO
    return this.shiftsService.claimShift(params.id, user.userId);
  }

  @Patch(':id/release')
  release(@Param() params: ShiftIdParamDto, @CurrentUser() user: User) {
    // userId z tokena, nie z body - BEZPIECZNIE
    // UUID walidowany przez DTO
    return this.shiftsService.releaseShift(params.id, user.userId);
  }

  @SkipThrottle() // GET endpointy są bezpieczne (autentykowane) i często używane
  @Get('users/all')
  getAllUsers() {
    // TODO: Może powinno być ograniczone do teamu? Na razie zostawiamy
    return this.shiftsService.getAllUsers();
  }

  @Public() // Publiczny endpoint - używany do pierwszego sync usera przed autentykacją
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 synców na minutę (zwiększone, bo jest wywoływany z dwóch miejsc: token endpoint + page.tsx)
  @Get('users/sync')
  async syncUser(@Query() query: SyncUserDto) {
    // Walidacja przez DTO (email, name)
    return this.shiftsService.syncUserByEmail(query.email, query.name || '');
  }

  @Post('teams')
  createTeam(@Body() createTeamDto: CreateTeamDto, @CurrentUser() user: User) {
    // userId z tokena - BEZPIECZNIE
    // Nazwa zespołu walidowana przez DTO
    return this.shiftsService.createTeam(user.userId, createTeamDto.name);
  }

  @Post('teams/join')
  joinTeam(@Body() joinTeamDto: JoinTeamDto, @CurrentUser() user: User) {
    // userId z tokena - BEZPIECZNIE
    // Kod zespołu walidowany przez DTO (dokładnie 12 znaków)
    return this.shiftsService.joinTeam(user.userId, joinTeamDto.code);
  }

  // Lista oczekujących (PENDING) - tylko dla OWNER/MANAGER
  @SkipThrottle() // GET endpointy są bezpieczne (autentykowane) i często używane
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

  @SkipThrottle() // GET endpointy są bezpieczne (autentykowane) i często używane
  @Get('team/members')
  getTeamMembers(@CurrentUser() user: User) {
    // userId z tokena - BEZPIECZNIE
    return this.shiftsService.getTeamMembers(user.userId);
  }

  @SkipThrottle() // GET endpointy są bezpieczne (autentykowane) i często używane
  @Get('teams/my-membership')
  getMyMembershipStatus(@CurrentUser() user: User) {
    // Zwraca status membership użytkownika (PENDING, ACTIVE, etc.)
    return this.shiftsService.getMyMembershipStatus(user.userId);
  }

  @Patch('users/me')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto, @CurrentUser() user: User) {
    // userId z tokena - BEZPIECZNIE
    // Name i phoneNumber walidowane przez DTO
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
    // requesterId z tokena - BEZPIECZNIE
    // targetId walidowany jako UUID przez DTO
    // Skills walidowane przez DTO (tablica stringów, max 20 elementów)
    return this.shiftsService.updateEmployee(user.userId, params.targetId, {
      skills: updateEmployeeDto.skills,
    });
  }
}