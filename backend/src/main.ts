import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    'https://shift-schedule-app-rho.vercel.app',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
        return callback(new Error('CORS: FRONTEND_URL must be set in production'));
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(3001);
}
bootstrap();