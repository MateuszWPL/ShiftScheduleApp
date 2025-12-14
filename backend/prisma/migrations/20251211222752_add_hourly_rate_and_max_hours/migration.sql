-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hourlyRate" DECIMAL(10,2),
ADD COLUMN     "maxHours" INTEGER,
ALTER COLUMN "skills" SET DEFAULT ARRAY[]::TEXT[];
