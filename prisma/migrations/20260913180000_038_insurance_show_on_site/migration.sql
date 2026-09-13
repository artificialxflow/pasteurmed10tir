-- AlterTable
ALTER TABLE "BaseInsurance" ADD COLUMN IF NOT EXISTS "showOnSite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BaseInsurance" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "ComplementaryInsurance" ADD COLUMN IF NOT EXISTS "showOnSite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ComplementaryInsurance" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
