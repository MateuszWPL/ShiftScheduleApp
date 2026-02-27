import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  v?: number; // tokenVersion — do unieważnienia sesji (wyloguj wszędzie)
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

    if (!secret) {
      throw new InternalServerErrorException('JWT secret is not configured.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    
    // Weryfikujemy czy user istnieje w bazie
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokenVersion = (payload as any).v ?? 0;
    const userVersion = (user as any).tokenVersion ?? 0;
    if (tokenVersion !== userVersion) {
      throw new UnauthorizedException('Sesja unieważniona. Zaloguj się ponownie.');
    }

    // Zwracamy user object, który będzie dostępny w @Request() jako req.user
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    };
  }
}

