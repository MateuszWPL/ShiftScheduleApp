import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
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
}

