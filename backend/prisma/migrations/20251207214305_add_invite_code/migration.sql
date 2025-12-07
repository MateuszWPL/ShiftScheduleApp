-- Add inviteCode column as nullable first
ALTER TABLE "Team" ADD COLUMN "inviteCode" TEXT;

-- Generate unique invite codes for existing rows
-- Format: 'c' + 24 alphanumeric chars = 25 total (matches Prisma's cuid() format)
-- Use md5 hash and ensure we get alphanumeric chars (0-9a-z) by combining two hashes
-- This creates codes compatible with Prisma's cuid() which uses base36 encoding
UPDATE "Team" 
SET "inviteCode" = 'c' || 
  SUBSTRING(
    lower(
      md5(random()::text || id::text || clock_timestamp()::text) ||
      md5(id::text || random()::text || extract(epoch from clock_timestamp())::text)
    ),
    1, 24
  )
WHERE "inviteCode" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "Team" ALTER COLUMN "inviteCode" SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX "Team_inviteCode_key" ON "Team"("inviteCode");

