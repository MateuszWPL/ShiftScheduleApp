import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { CreatePositionDto, UpdatePositionDto, AssignPositionsDto } from './dto/position.dto';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @SkipThrottle()
  @Get()
  getPositions(@CurrentUser() user: any) {
    return this.positionsService.getPositions(user.userId);
  }

  @Post()
  createPosition(@CurrentUser() user: any, @Body() dto: CreatePositionDto) {
    return this.positionsService.createPosition(user.userId, dto);
  }

  @Patch(':id')
  updatePosition(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.positionsService.updatePosition(user.userId, id, dto);
  }

  @Delete(':id')
  deletePosition(@CurrentUser() user: any, @Param('id') id: string) {
    return this.positionsService.deletePosition(user.userId, id);
  }

  /** Assign positions to an employee (replaces all) */
  @Post('employees/:userId')
  assignPositions(
    @CurrentUser() user: any,
    @Param('userId') targetUserId: string,
    @Body() dto: AssignPositionsDto,
  ) {
    return this.positionsService.assignPositionsToEmployee(user.userId, targetUserId, dto.positionIds);
  }

  /** Get positions assigned to an employee (requester must be in same team) */
  @SkipThrottle()
  @Get('employees/:userId')
  getEmployeePositions(
    @CurrentUser() user: any,
    @Param('userId') targetUserId: string,
  ) {
    return this.positionsService.getEmployeePositions(user.userId, targetUserId);
  }

  /** One-time migration: create positions from existing shift roleNames */
  @Post('migrate')
  migrate(@CurrentUser() user: any) {
    return this.positionsService.migrateFromRoleNames(user.userId);
  }
}
