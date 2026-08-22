-- AlterTable
ALTER TABLE "MembershipApplication" ADD COLUMN "zohalStatus" TEXT,
ADD COLUMN "zohalPayload" JSONB,
ADD COLUMN "shahkarMatched" BOOLEAN,
ADD COLUMN "zohalCheckedAt" TIMESTAMP(3),
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewNote" TEXT;
