import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Sprawdzamy czy endpoint jest publiczny
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const route = `${request.method} ${request.url}`;
    console.log('[AUTH] Guard check - route:', route, 'isPublic:', isPublic, 'authHeader:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      console.error('[AUTH] No Authorization header in request');
    }

    return super.canActivate(context);
  }
}

