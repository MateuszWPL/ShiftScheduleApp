import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

function validateRequiredEnvVars() {
  const logger = new Logger('Bootstrap');
  const required: string[] = [];

  if (process.env.NODE_ENV === 'production') {
    required.push('DATABASE_URL', 'FRONTEND_URL');
  }

  // Always require at least one JWT secret
  if (!process.env.JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
    logger.error('FATAL: Neither JWT_SECRET nor NEXTAUTH_SECRET is set. Aborting.');
    process.exit(1);
  }

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error(`FATAL: Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function bootstrap() {
  validateRequiredEnvVars();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Disable X-Powered-By
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
          return constraints.join(', ');
        });
        return new BadRequestException({
          statusCode: 400,
          message: 'Błąd walidacji',
          errors: messages,
        });
      },
    }),
  );

  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? (frontendUrl ? frontendUrl.split(',').map((u) => u.trim()).filter(Boolean) : [])
      : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      if (allowedOrigins.length === 0) return callback(new Error('CORS: FRONTEND_URL must be set in production'));
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  new Logger('Bootstrap').log(`Application running on port ${port}`);
}
bootstrap();