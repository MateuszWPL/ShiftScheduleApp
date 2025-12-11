import { Controller, Post, Body, Param, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // Endpoint publiczny - nie wymaga JWT
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 rejestracje na minutę
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public() // Endpoint publiczny - nie wymaga JWT
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 prób logowania na minutę
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public() // Endpoint publiczny - nie wymaga JWT
  @Get('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public() // Endpoint publiczny - nie wymaga JWT
  @Throttle({ default: { limit: 2, ttl: 60000 } }) // 2 maile weryfikacyjne na minutę
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendDto.email);
  }

  @Public() // Endpoint publiczny - nie wymaga JWT
  @Throttle({ default: { limit: 2, ttl: 60000 } }) // 2 prośby o reset hasła na minutę
  @Post('request-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() requestResetDto: RequestResetPasswordDto) {
    return this.authService.requestPasswordReset(requestResetDto);
  }

  @Public() // Endpoint publiczny - nie wymaga JWT
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 prób resetu hasła na minutę
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}

