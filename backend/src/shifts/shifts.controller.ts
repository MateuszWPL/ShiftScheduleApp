import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll(@Query('userId') userId: string) {
    if (!userId) {
      // Proste zabezpieczenie
      return []; 
    }
    return this.shiftsService.findAll(userId);
  }
  @Post(':id/claim')
  claim(@Param('id') id: string, @Body('userId') userId: string) {
    return this.shiftsService.claimShift(id, userId);
  }
  @Patch(':id/release')
  release(@Param('id') id: string, @Body('userId') userId: string) {
    return this.shiftsService.releaseShift(id, userId);
  }
  @Get('users/all')
  getAllUsers() {
    return this.shiftsService.getAllUsers();
  }
  @Get('users/sync')
  async syncUser(@Query('email') email: string, @Query('name') name: string) {
    return this.shiftsService.syncUserByEmail(email, name);
  }
  @Post('teams')
  createTeam(@Body('userId') userId: string, @Body('name') name: string) {
    return this.shiftsService.createTeam(userId, name);
  }
  @Post('teams/join')
  joinTeam(@Body('userId') userId: string, @Body('code') code: string) {
    return this.shiftsService.joinTeam(userId, code);
  }
  @Get('team/members')
  getTeamMembers(@Query('userId') userId: string) {
    return this.shiftsService.getTeamMembers(userId);
  }
  @Patch('users/me')
  updateProfile(@Body('userId') userId: string, @Body('name') name: string, @Body('phoneNumber') phoneNumber: string) {
    return this.shiftsService.updateProfile(userId, { name, phoneNumber });
  }
}