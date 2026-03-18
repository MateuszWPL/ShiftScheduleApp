-- Simplify roles: OWNER + MANAGER -> ADMIN, EMPLOYEE stays.

-- 1. Add new value ADMIN to the existing enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';

-- 2. Convert existing OWNER and MANAGER rows to ADMIN
UPDATE "User" SET "role" = 'ADMIN'::"Role" WHERE "role" IN ('OWNER'::"Role", 'MANAGER'::"Role");
UPDATE "TeamMembership" SET "role" = 'ADMIN'::"Role" WHERE "role" IN ('OWNER'::"Role", 'MANAGER'::"Role");

-- 3. Rebuild enum without OWNER and MANAGER
-- PostgreSQL does not support removing values from an enum directly,
-- so we create a new enum, migrate columns, then swap.
ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE'::"Role";

ALTER TABLE "TeamMembership" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "TeamMembership" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "TeamMembership" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE'::"Role";

DROP TYPE "Role_old";
