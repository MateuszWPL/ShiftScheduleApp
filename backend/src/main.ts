import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Włączamy walidację (DTO) z lepszymi błędami
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Usuwa nieznane właściwości z DTO
      forbidNonWhitelisted: true, // Rzuca błąd jeśli są nieznane właściwości
      transform: true, // Automatycznie transformuje typy (np. string -> number)
      transformOptions: {
        enableImplicitConversion: true, // Pozwala na automatyczną konwersję typów
      },
      // Lepsze komunikaty błędów
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

  // 2. Włączamy CORS (żeby Frontend z portu 3000 mógł pytać Backend na 3001)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    'https://shift-schedule-app-rho.vercel.app',
  ].filter(Boolean); // Usuwa undefined/null wartości

  app.enableCors({
    origin: (origin, callback) => {
      // Pozwól na requesty bez origin (np. Postman, mobile apps)
      if (!origin) {
        return callback(null, true);
      }
      
      // Sprawdź czy origin jest na liście dozwolonych
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // Na produkcji, jeśli nie ma FRONTEND_URL, pozwól wszystkim (fallback)
      if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
        return callback(null, true);
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

  // 3. ZMIANA PORTU NA 3001
  await app.listen(3001);
  console.log(`Application is running on: http://localhost:3001`);
}
bootstrap();