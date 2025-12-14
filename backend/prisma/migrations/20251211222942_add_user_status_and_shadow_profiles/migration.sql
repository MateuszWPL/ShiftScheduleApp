-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'UNCLAIMED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "email" DROP NOT NULL;
