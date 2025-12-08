import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      // Secret będzie używany tylko do weryfikacji (NextAuth generuje tokeny)
      // W praktyce NextAuth używa własnego secret, więc musimy użyć tego samego
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
      signOptions: {
        // Nie używamy tego do generowania tokenów (NextAuth to robi)
        // Ale musimy mieć to dla JwtModule
      },
    }),
    PrismaModule,
  ],
  providers: [JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}

