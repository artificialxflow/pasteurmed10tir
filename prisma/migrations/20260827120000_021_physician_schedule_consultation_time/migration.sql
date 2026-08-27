-- AlterTable
ALTER TABLE "Physician" ADD COLUMN IF NOT EXISTS "hours" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Physician" ADD COLUMN IF NOT EXISTS "schedule" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "preferredDate" TEXT;
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "preferredDateLabel" TEXT;
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "preferredTime" TEXT;
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "preferredTimeLabel" TEXT;
