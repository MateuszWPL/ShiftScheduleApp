-- Simplify roles: OWNER + MANAGER -> ADMIN, EMPLOYEE stays.
-- Uses enum swap approach to avoid the "unsafe use of new enum value" PostgreSQL restriction.

-- 1. Convert OWNER and MANAGER to ADMIN via text column (bypasses enum constraints)
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE text USING "role"::text;
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" IN ('OWNER', 'MANAGER');
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';

ALTER TABLE "TeamMembership" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "TeamMembership" ALTER COLUMN "role" TYPE text USING "role"::text;
UPDATE "TeamMembership" SET "role" = 'ADMIN' WHERE "role" IN ('OWNER', 'MANAGER');
ALTER TABLE "TeamMembership" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';

-- 2. Drop the old enum and create the new one
DROP TYPE "Role";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

-- 3. Cast text columns back to the new enum
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE'::"Role";

ALTER TABLE "TeamMembership" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "TeamMembership" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "TeamMembership" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE'::"Role";
