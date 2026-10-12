-- CreateEnum
CREATE TYPE "InstallmentDocumentKind" AS ENUM ('contract', 'cheque');

-- CreateTable
CREATE TABLE "InstallmentPlanDocument" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "kind" "InstallmentDocumentKind" NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallmentPlanDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InstallmentPlanDocument_planId_idx" ON "InstallmentPlanDocument"("planId");
CREATE INDEX "InstallmentPlanDocument_kind_idx" ON "InstallmentPlanDocument"("kind");

ALTER TABLE "InstallmentPlanDocument" ADD CONSTRAINT "InstallmentPlanDocument_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
