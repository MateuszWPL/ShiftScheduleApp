import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PremiumGuard } from '../auth/guards/premium.guard';
import { RequirePlan } from '../auth/decorators/premium.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateTemplateFromWeekDto } from './dto/create-template-from-week.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ApplyTemplateDto } from './dto/apply-template.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard, PremiumGuard)
@RequirePlan('business')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  getAll(@CurrentUser() user: { userId: string }) {
    return this.templatesService.getAll(user.userId);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.templatesService.getOne(user.userId, id);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(user.userId, dto);
  }

  @Post('from-week')
  createFromWeek(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateTemplateFromWeekDto,
  ) {
    return this.templatesService.createFromWeek(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.templatesService.remove(user.userId, id);
  }

  @Post(':id/apply')
  apply(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: ApplyTemplateDto,
  ) {
    return this.templatesService.apply(user.userId, id, dto);
  }
}
