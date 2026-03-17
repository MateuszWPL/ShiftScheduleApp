import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PremiumGuard } from '../auth/guards/premium.guard';
import { RequirePlan } from '../auth/decorators/premium.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@Controller('locations')
@UseGuards(JwtAuthGuard, PremiumGuard)
@RequirePlan('business')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @SkipThrottle()
  @Get()
  getLocations(@CurrentUser() user: any) {
    return this.locationsService.getLocations(user.userId);
  }

  @Post()
  createLocation(@CurrentUser() user: any, @Body() dto: CreateLocationDto) {
    return this.locationsService.createLocation(user.userId, dto);
  }

  @Patch(':id')
  updateLocation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.updateLocation(user.userId, id, dto);
  }

  @Delete(':id')
  deleteLocation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.locationsService.deleteLocation(user.userId, id);
  }

  @Patch(':id/default')
  setDefault(@CurrentUser() user: any, @Param('id') id: string) {
    return this.locationsService.setDefaultLocation(user.userId, id);
  }
}
