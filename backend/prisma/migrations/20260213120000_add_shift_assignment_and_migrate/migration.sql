-- CreateTable: ShiftAssignment (wiele pracowników na jednej zmianie, giełda na poziomie przypisania)
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT,
    "isUpForGrabs" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- Migracja danych: każde istniejące Shift dostaje jedno przypisanie (stare userId + isUpForGrabs)
INSERT INTO "ShiftAssignment" ("id", "shiftId", "userId", "isUpForGrabs", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "id", "userId", "isUpForGrabs", NOW(), NOW()
FROM "Shift";

-- Indeksy
CREATE INDEX "ShiftAssignment_shiftId_idx" ON "ShiftAssignment"("shiftId");
CREATE INDEX "ShiftAssignment_userId_idx" ON "ShiftAssignment"("userId");
CREATE INDEX "ShiftAssignment_isUpForGrabs_idx" ON "ShiftAssignment"("isUpForGrabs");

-- Klucze obce
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Usunięcie starych kolumn z Shift
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_userId_fkey";
ALTER TABLE "Shift" DROP COLUMN "userId";
ALTER TABLE "Shift" DROP COLUMN "isUpForGrabs";
