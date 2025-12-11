import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Sprawdź czy email już istnieje
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Użytkownik z tym emailem już istnieje.');
    }

    // Hash hasła
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Generuj token weryfikacyjny (32 znaki hex)
    const verificationToken = randomBytes(16).toString('hex');

    // Utwórz użytkownika
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        password: hashedPassword,
        provider: 'email',
        emailVerified: false, // Wymaga weryfikacji emaila
        emailVerificationToken: verificationToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        provider: true,
        createdAt: true,
        // Nie zwracamy hasła ani tokenu!
      },
    });

    // Wyślij email weryfikacyjny ASYNCHRONICZNIE (fire-and-forget)
    // Nie czekamy na odpowiedź - rejestracja kończy się natychmiast
    this.emailService.sendVerificationEmail(
      registerDto.email,
      registerDto.name,
      verificationToken,
    ).catch((error) => {
      console.error('[AUTH] Błąd wysyłania emaila weryfikacyjnego (async):', error);
      // Logujemy błąd, ale nie blokujemy rejestracji
    });

    return {
      user,
      message: 'Konto zostało utworzone. Sprawdź email w celu weryfikacji.',
    };
  }

  async login(loginDto: LoginDto) {
    // Znajdź użytkownika
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło.');
    }

    // Sprawdź czy użytkownik ma hasło (nie jest z Google)
    if (!user.password) {
      throw new UnauthorizedException('To konto używa logowania przez Google. Zaloguj się przez Google.');
    }

    // Sprawdź hasło
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło.');
    }

    // Sprawdź czy email jest zweryfikowany
    if (!user.emailVerified) {
      throw new UnauthorizedException('Email nie został zweryfikowany. Sprawdź skrzynkę pocztową.');
    }

    // Generuj JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
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

    // Zweryfikuj email
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null, // Usuń token po weryfikacji
      },
    });

    // Wyślij mail powitalny po weryfikacji asynchronicznie
    this.emailService.sendWelcomeEmailAfterVerification(
      user.email,
      user.name,
    ).catch((error) => {
      console.error('[AUTH] Błąd wysyłania maila powitalnego (after verification):', error);
      // Logujemy błąd, ale nie blokujemy weryfikacji
    });

    return {
      message: 'Email został pomyślnie zweryfikowany. Możesz się teraz zalogować.',
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Nie ujawniamy że użytkownik nie istnieje (security best practice)
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

    // Generuj nowy token
    const verificationToken = randomBytes(16).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
      },
    });

    // Wyślij email
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken,
      );
    } catch (error) {
      console.error('[AUTH] Błąd wysyłania emaila weryfikacyjnego:', error);
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

    // Nie ujawniamy czy użytkownik istnieje (security best practice)
    if (!user) {
      return {
        message: 'Jeśli konto istnieje, email z linkiem resetu hasła został wysłany.',
      };
    }

    // Sprawdź czy użytkownik ma hasło (nie jest z Google)
    if (!user.password) {
      // Nie ujawniamy że to konto Google - po prostu zwracamy sukces
      return {
        message: 'Jeśli konto istnieje, email z linkiem resetu hasła został wysłany.',
      };
    }

    // Generuj token resetu (32 znaki hex)
    const resetToken = randomBytes(16).toString('hex');
    // Token ważny przez 1 godzinę
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Wyślij email asynchronicznie
    this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
    ).catch((error) => {
      console.error('[AUTH] Błąd wysyłania emaila resetu hasła (async):', error);
      // Logujemy błąd, ale nie blokujemy operacji
    });

    return {
      message: 'Jeśli konto istnieje, email z linkiem resetu hasła został wysłany.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Znajdź użytkownika po tokenie
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: resetPasswordDto.token,
        passwordResetExpires: {
          gt: new Date(), // Token musi być jeszcze ważny
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

    // Zaktualizuj hasło i usuń token
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

