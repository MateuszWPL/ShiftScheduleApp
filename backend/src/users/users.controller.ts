import { Controller, Get, Post, Body, Param, Patch, UseGuards, BadRequestException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUser as CurrentUserType } from '../auth/decorators/user.decorator';
import { CreateShadowProfileDto } from './dto/create-shadow-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { memoryStorage } from 'multer';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('shadow-profile')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  async createShadowProfile(
    @Body() createDto: CreateShadowProfileDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!user.teamId) {
      throw new BadRequestException('Użytkownik musi należeć do zespołu');
    }
    return this.usersService.createShadowProfile(user.teamId, createDto);
  }

  @SkipThrottle()
  @Get()
  async findAll(@CurrentUser() user: CurrentUserType) {
    if (!user.teamId) {
      throw new BadRequestException('Użytkownik musi należeć do zespołu');
    }
    return this.usersService.findAll(user.teamId, user.role);
  }

  @SkipThrottle()
  @Get('me')
  async getMyProfile(@CurrentUser() user: CurrentUserType) {
    return this.usersService.findOne(user.userId, user.role, user.teamId);
  }

  @Patch('me')
  async updateMyProfile(
    @Body() updateDto: UpdateProfileDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.usersService.updateProfile(user.userId, updateDto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Tylko pliki obrazów (JPG, PNG, GIF, WEBP) są dozwolone'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!file) {
      throw new BadRequestException('Brak pliku do uploadu');
    }

    try {
      // Upload do Cloudinary
      const result = await this.cloudinaryService.uploadImage(file, 'avatars');
      
      // Zaktualizuj profil użytkownika z URL z Cloudinary
      return this.usersService.updateProfile(user.userId, {
        avatarUrl: result.secure_url,
      });
    } catch (error) {
      throw new BadRequestException('Błąd podczas wgrywania zdjęcia: ' + (error as Error).message);
    }
  }

  @SkipThrottle()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.usersService.findOne(id, user.role, user.teamId);
  }
}
