import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      return false;
    }

    // Log token preview (first 20 chars)
    const tokenPreview = authHeader.replace('Bearer ', '').substring(0, 20);
    console.log('[AUTH] Token preview:', tokenPreview + '...');

    try {
      const result = await super.canActivate(context) as Promise<boolean>;
      console.log('[AUTH] Guard passed');
      return result;
    } catch (error: any) {
      console.error('[AUTH] Guard failed with error:', error?.message || 'Unknown error');
      console.error('[AUTH] Error name:', error?.name);
      console.error('[AUTH] Error code:', error?.code);
      if (error?.stack) {
        console.error('[AUTH] Error stack:', error.stack);
      }
      throw error;
    }
  }
}

