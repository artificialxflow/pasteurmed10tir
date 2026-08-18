-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN "zohalStatus" TEXT,
ADD COLUMN "zohalPayload" JSONB,
ADD COLUMN "shahkarMatched" BOOLEAN,
ADD COLUMN "zohalCheckedAt" TIMESTAMP(3);
