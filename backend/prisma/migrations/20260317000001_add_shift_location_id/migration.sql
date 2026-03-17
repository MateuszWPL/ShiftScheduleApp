-- AlterTable
ALTER TABLE "Shift" ADD COLUMN "locationId" TEXT;

-- CreateIndex
CREATE INDEX "Shift_teamId_locationId_startTime_idx" ON "Shift"("teamId", "locationId", "startTime");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
