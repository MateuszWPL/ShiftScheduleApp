import { Injectable, BadRequestException, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';
import { DEFAULT_USER_NICKNAME } from '../constants/user-defaults';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Użytkownik z tym emailem już istnieje.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);
    const verificationToken = randomBytes(16).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        nickname: DEFAULT_USER_NICKNAME,
        password: hashedPassword,
        provider: 'email',
        emailVerified: false,
        emailVerificationToken: verificationToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        provider: true,
        createdAt: true,
      },
    });

    this.emailService.sendVerificationEmail(
      registerDto.email,
      registerDto.name,
      verificationToken,
    ).catch((error) => {
      this.logger.error('Błąd wysyłania emaila weryfikacyjnego (async)', error);
    });

    return {
      user,
      message: 'Konto zostało utworzone. Sprawdź email w celu weryfikacji.',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło.');
    }

    if (user.status === 'UNCLAIMED') {
      throw new UnauthorizedException('To konto nie zostało jeszcze aktywowane.');
    }

    if (!user.password) {
      throw new UnauthorizedException('To konto używa logowania przez Google. Zaloguj się przez Google.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło.');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email nie został zweryfikowany. Sprawdź skrzynkę pocztową.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      v: (user as any).tokenVersion ?? 0,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Nieprawidłowy token weryfikacyjny.');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email został już zweryfikowany.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    if (user.email) {
      this.emailService.sendWelcomeEmailAfterVerification(
        user.email,
        user.name,
      ).catch((error) => {
        this.logger.error('Błąd wysyłania maila powitalnego (after verification)', error);
      });
    }

    return {
      message: 'Email został pomyślnie zweryfikowany. Możesz się teraz zalogować.',
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        message: 'Jeśli konto istnieje, email weryfikacyjny został wysłany.',
      };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email został już zweryfikowany.');
    }

    if (!user.password) {
      throw new BadRequestException('To konto używa logowania przez Google i nie wymaga weryfikacji emaila.');
    }

    const verificationToken = randomBytes(16).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
      },
    });

    if (!user.email) {
      throw new BadRequestException('Użytkownik nie ma przypisanego emaila.');
    }
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken,
      );
    } catch (error) {
      this.logger.error('Błąd wysyłania emaila weryfikacyjnego', error);
      throw new BadRequestException('Nie udało się wysłać emaila. Spróbuj ponownie później.');
    }

    return {
      message: 'Email weryfikacyjny został wysłany. Sprawdź skrzynkę pocztową.',
    };
  }

  async requestPasswordReset(requestResetDto: RequestResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: requestResetDto.email },
    });

    if (!user) {
      return {
        message: 'Jeśli konto istnieje, email z linkiem resetu hasła został wysłany.',
      };
    }

    if (!user.password) {
      return {
        message: 'Jeśli konto istnieje, email z linkiem resetu hasła został wysłany.',
      };
    }

    const resetToken = randomBytes(16).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    if (user.email) {
      this.emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken,
      ).catch((error) => {
        this.logger.error('Błąd wysyłania emaila resetu hasła (async)', error);
      });
    }

    return {
      message: 'Jeśli konto istnieje, email z linkiem resetu hasła został wysłany.',
    };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    this.logger.log(`User ${userId} revoked all sessions`);
    return { success: true, message: 'Wszystkie sesje zostały unieważnione.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: resetPasswordDto.token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Nieprawidłowy lub wygasły token resetu hasła.');
    }

    // Sprawdź czy użytkownik ma hasło (nie jest z Google)
    if (!user.password) {
      throw new BadRequestException('To konto używa logowania przez Google i nie ma hasła do zresetowania.');
    }

    // Hash nowego hasła
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return {
      message: 'Hasło zostało pomyślnie zresetowane. Możesz się teraz zalogować.',
    };
  }
}

