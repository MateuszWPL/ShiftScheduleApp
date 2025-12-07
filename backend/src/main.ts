import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Włączamy walidację (DTO)
  app.useGlobalPipes(new ValidationPipe());

  // 2. Włączamy CORS (żeby Frontend z portu 3000 mógł pytać Backend na 3001)
  app.enableCors();

  // 3. ZMIANA PORTU NA 3001
  await app.listen(3001);
  console.log(`Application is running on: http://localhost:3001`);
}
bootstrap();