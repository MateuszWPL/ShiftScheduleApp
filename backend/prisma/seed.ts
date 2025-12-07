import { PrismaClient, Role, ShiftStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Team
  const team = await prisma.team.create({
    data: { name: 'Restauracja Centrum' },
  });

  // 2. Create Users
  const manager = await prisma.user.create({
    data: {
      email: 'boss@example.com',
      name: 'Szef Janusz',
      role: Role.MANAGER,
      teamId: team.id,
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'arek@example.com',
      name: 'Arek Pracownik',
      role: Role.EMPLOYEE,
      teamId: team.id,
    },
  });

  // 3. Create a Shift that is UP FOR GRABS
  // Jutro 08:00 - 16:00
  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(8, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(16, 0, 0, 0);

  await prisma.shift.create({
    data: {
      teamId: team.id,
      userId: employee.id, // Przypisane do Arka
      roleName: 'Kelner',
      startTime: tomorrowStart,
      endTime: tomorrowEnd,
      status: ShiftStatus.PUBLISHED,
      isUpForGrabs: true, // <--- KLUCZOWE: Arek chce oddać tę zmianę
    },
  });

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });