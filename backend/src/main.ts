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
  app.enableCors({
    origin: '*', // NA START: Pozwalamy wszystkim. Na produkcji zmienimy to na domenę frontendu.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // 3. ZMIANA PORTU NA 3001
  await app.listen(3001);
  console.log(`Application is running on: http://localhost:3001`);
}
bootstrap();