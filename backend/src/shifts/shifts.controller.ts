import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser, CurrentUser as User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('shifts')
@UseGuards(JwtAuthGuard) // Wszystkie endpointy wymagają autentykacji
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    // userId jest teraz z tokena, nie z query - BEZPIECZNIE
    return this.shiftsService.findAll(user.userId);
  }

  @Post(':id/claim')
  claim(@Param('id') id: string, @CurrentUser() user: User) {
    // userId z tokena, nie z body - BEZPIECZNIE
    return this.shiftsService.claimShift(id, user.userId);
  }

  @Patch(':id/release')
  release(@Param('id') id: string, @CurrentUser() user: User) {
    // userId z tokena, nie z body - BEZPIECZNIE
    return this.shiftsService.releaseShift(id, user.userId);
  }

  @Get('users/all')
  getAllUsers() {
    // TODO: Może powinno być ograniczone do teamu? Na razie zostawiamy
    return this.shiftsService.getAllUsers();
  }

  @Public() // Publiczny endpoint - używany do pierwszego sync usera przed autentykacją
  @Get('users/sync')
  async syncUser(@Query('email') email: string, @Query('name') name: string) {
    // UWAGA: Ten endpoint jest publiczny, ale powinien być chroniony przez rate limiting w produkcji
    return this.shiftsService.syncUserByEmail(email, name);
  }

  @Post('teams')
  createTeam(@Body('name') name: string, @CurrentUser() user: User) {
    // userId z tokena - BEZPIECZNIE
    return this.shiftsService.createTeam(user.userId, name);
  }

  @Post('teams/join')
  joinTeam(@Body('code') code: string, @CurrentUser() user: User) {
    // userId z tokena - BEZPIECZNIE
    return this.shiftsService.joinTeam(user.userId, code);
  }

  @Get('team/members')
  getTeamMembers(@CurrentUser() user: User) {
    // userId z tokena - BEZPIECZNIE
    return this.shiftsService.getTeamMembers(user.userId);
  }

  @Patch('users/me')
  updateProfile(@Body('name') name: string, @Body('phoneNumber') phoneNumber: string, @CurrentUser() user: User) {
    // userId z tokena - BEZPIECZNIE
    return this.shiftsService.updateProfile(user.userId, { name, phoneNumber });
  }

  @Patch('teams/members/:targetId')
  updateEmployee(
    @Param('targetId') targetId: string,
    @Body('skills') skills: string[],
    @CurrentUser() user: User
  ) {
    // requesterId z tokena - BEZPIECZNIE
    return this.shiftsService.updateEmployee(user.userId, targetId, { skills });
  }
}