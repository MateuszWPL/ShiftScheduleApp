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

    const result = super.canActivate(context);
    // canActivate może zwrócić boolean, Promise<boolean> lub Observable<boolean>
    if (result instanceof Promise) {
      return result;
    }

    if (typeof result === 'boolean') {
      return result;
    }

    const { firstValueFrom } = await import('rxjs');
    return firstValueFrom(result);
  }
}

