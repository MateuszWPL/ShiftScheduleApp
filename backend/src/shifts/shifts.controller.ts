import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll() {
    return this.shiftsService.findAll();
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
}