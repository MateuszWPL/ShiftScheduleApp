import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';
import { SlotIdParamDto } from './dto/params.dto';

@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  create(
    @Body() body: CreateAvailabilityDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.availabilityService.createSlots(user.userId, body);
  }

  @Get('me')
  findMy(
    @Query() query: QueryAvailabilityDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.availabilityService.findMySlots(user.userId, query.from, query.to);
  }

  @Get('team')
  findTeam(
    @Query() query: QueryAvailabilityDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.availabilityService.findTeamSlots(user.userId, query.from, query.to);
  }

  @Patch('slots/:slotId')
  updateSlot(
    @Param() params: SlotIdParamDto,
    @Body() body: UpdateAvailabilityDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.availabilityService.updateSlot(user.userId, params.slotId, body);
  }

  @Delete('slots/:slotId')
  deleteSlot(
    @Param() params: SlotIdParamDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.availabilityService.deleteSlot(user.userId, params.slotId);
  }
}
