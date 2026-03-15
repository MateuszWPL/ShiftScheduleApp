import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Loguj do Sentry tylko nieoczekiwane błędy 5xx
    // Błędy 4xx (walidacja, autoryzacja) są "oczekiwane" — nie zaśmiecają Sentry
    if (!isHttp || status >= 500) {
      const user = (request as Request & { user?: { id?: string; teamId?: string; role?: string } }).user;

      Sentry.withScope((scope) => {
        scope.setTag('method', request.method);
        scope.setTag('url', request.url.split('?')[0]); // bez query-string (ochrona PII)
        scope.setTag('statusCode', String(status));

        // Przekaż tylko anonimowe identyfikatory — nigdy email ani dane osobowe
        if (user?.id) scope.setUser({ id: user.id });
        if (user?.teamId) scope.setTag('teamId', user.teamId);
        if (user?.role) scope.setTag('role', user.role);

        Sentry.captureException(exception);
      });

      this.logger.error(
        `Unhandled exception [${request.method} ${request.url}] status=${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // W produkcji: czysta odpowiedź 500 bez stack trace
    // W developmencie: pełne informacje dla debugowania
    const isProd = process.env.NODE_ENV === 'production';

    if (isHttp) {
      // Dla HttpException zachowaj oryginalną strukturę odpowiedzi (walidacja, 401, 403 itp.)
      const httpResponse = exception.getResponse();
      response.status(status).json(httpResponse);
    } else {
      // Dla nieoczekiwanych błędów — zawsze ukrywaj szczegóły w produkcji
      response.status(status).json({
        statusCode: status,
        message: isProd
          ? 'Wystąpił błąd serwera. Nasz zespół został powiadomiony.'
          : exception instanceof Error
            ? exception.message
            : 'Internal server error',
        ...(isProd
          ? {}
          : {
              stack: exception instanceof Error ? exception.stack : undefined,
            }),
      });
    }
  }
}
