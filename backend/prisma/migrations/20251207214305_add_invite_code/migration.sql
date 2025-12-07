-- Add inviteCode column as nullable first
ALTER TABLE "Team" ADD COLUMN "inviteCode" TEXT;

-- Generate unique invite codes for existing rows
-- Using md5 of random UUID for CUID-like values (guaranteed unique per row)
UPDATE "Team" 
SET "inviteCode" = 'c' || 
  SUBSTRING(md5(random()::text || id::text || clock_timestamp()::text), 1, 25)
WHERE "inviteCode" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "Team" ALTER COLUMN "inviteCode" SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX "Team_inviteCode_key" ON "Team"("inviteCode");

