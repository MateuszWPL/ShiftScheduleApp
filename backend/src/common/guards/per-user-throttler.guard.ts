import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Throttler używający userId (gdy zalogowany) lub IP jako klucza.
 * Dla requestów z Bearer JWT dekoduje payload i używa sub (userId).
 * Dla publicznych (auth) używa IP.
 */
function decodeJwtSub(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    const decoded = JSON.parse(payload) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

@Injectable()
export class PerUserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const user = req.user as { userId?: string } | undefined;
    if (user?.userId) {
      return `user-${user.userId}`;
    }
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const sub = decodeJwtSub(auth.slice(7));
      if (sub) return `user-${sub}`;
    }
    return `ip-${req.ip ?? req.socket?.remoteAddress ?? 'unknown'}`;
  }
}
