-- Soft-delete for loans / installment plans / facility requests.
-- Do NOT reuse InstallmentPlan.status = 'hidden' — that value is reserved
-- for the legacy-membership filter tab.

-- AlterTable
ALTER TABLE "MembershipApplication" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deleteNote" TEXT;

-- AlterTable
ALTER TABLE "FacilityRequest" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deleteNote" TEXT;

-- AlterTable
ALTER TABLE "InstallmentPlan" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deleteNote" TEXT;

-- CreateIndex
CREATE INDEX "MembershipApplication_deletedAt_idx" ON "MembershipApplication"("deletedAt");

-- CreateIndex
CREATE INDEX "FacilityRequest_deletedAt_idx" ON "FacilityRequest"("deletedAt");

-- CreateIndex
CREATE INDEX "InstallmentPlan_deletedAt_idx" ON "InstallmentPlan"("deletedAt");
