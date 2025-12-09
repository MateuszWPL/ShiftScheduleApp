import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production';
    console.log('[JWT] Strategy initialized');
    console.log('[JWT] Secret source:', process.env.JWT_SECRET ? 'JWT_SECRET' : process.env.NEXTAUTH_SECRET ? 'NEXTAUTH_SECRET' : 'DEFAULT');
    console.log('[JWT] Secret length:', secret?.length || 0);
    console.log('[JWT] Secret first 10 chars:', secret?.substring(0, 10) || 'N/A');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('[JWT] Validating token, payload:', { sub: payload.sub, email: payload.email });
    
    // Weryfikujemy czy user istnieje w bazie
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      console.error('[JWT] User not found for id:', payload.sub);
      throw new UnauthorizedException('User not found');
    }

    console.log('[JWT] Token validated successfully for user:', user.email);

    // Zwracamy user object, który będzie dostępny w @Request() jako req.user
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    };
  }
}

