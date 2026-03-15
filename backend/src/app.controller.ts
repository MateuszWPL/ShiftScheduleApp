import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Endpoint testowy — dostępny TYLKO w środowisku developerskim
  // Używaj: GET /debug/sentry-test (sprawdź czy błąd trafia do Sentry)
  @Get('debug/sentry-test')
  sentryTest(): never {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Not available in production');
    }
    throw new Error('[Sentry test] Celowo wywołany błąd testowy — jeśli widzisz to w Sentry, integracja działa!');
  }
}
