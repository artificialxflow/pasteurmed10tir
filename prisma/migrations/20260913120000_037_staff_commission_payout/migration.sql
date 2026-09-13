-- AlterTable
ALTER TABLE "Physician" ADD COLUMN "commissionPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "consultantCommissionPercent" INTEGER NOT NULL DEFAULT 10;

-- AlterTable StaffCommission: remove FieldStaff FK; add payout columns
ALTER TABLE "StaffCommission" DROP CONSTRAINT "StaffCommission_staffId_fkey";

ALTER TABLE "StaffCommission" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "StaffCommission" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "StaffCommission" ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'home_visit';
ALTER TABLE "StaffCommission" ADD COLUMN "sourceLabel" TEXT;

CREATE INDEX "StaffCommission_status_idx" ON "StaffCommission"("status");
