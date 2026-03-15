import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('sentry/debug-back')
  sentryDebugBack(): never {
    throw new Error(
      '[Sentry Backend Test] Celowo wywołany błąd — jeśli widzisz to w Sentry, integracja działa!',
    );
  }
}
