import { PrismaClient, Role, ShiftStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Czysta baza - bez danych testowych
  // Użytkownicy będą tworzyć zespoły przez UI aplikacji
  
  console.log('✅ Seeding finished (empty database).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
