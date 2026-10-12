-- CreateEnum
CREATE TYPE "FollowUpNoShowReason" AS ENUM ('no_need', 'no_answer', 'relocated', 'financial', 'scheduling', 'other_clinic', 'work_completed');

-- AlterEnum
ALTER TYPE "FollowUpAttendedAction" ADD VALUE 'in_progress';
ALTER TYPE "MarketingFollowUpKind" ADD VALUE 'sample';

-- AlterTable
ALTER TABLE "FollowUpCase" ADD COLUMN "noShowReason" "FollowUpNoShowReason";

ALTER TABLE "MarketingReport" ADD COLUMN "successProforma" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MarketingReport" ADD COLUMN "successSalesInvoice" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "HealthRecordEntry" ADD COLUMN "dependentId" TEXT;
CREATE INDEX "HealthRecordEntry_dependentId_idx" ON "HealthRecordEntry"("dependentId");
ALTER TABLE "HealthRecordEntry" ADD CONSTRAINT "HealthRecordEntry_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SpecialistReferral" ADD COLUMN "specialistSpecialty" TEXT;
ALTER TABLE "SpecialistReferral" ADD COLUMN "emergencyPhysicianId" TEXT;
CREATE INDEX "SpecialistReferral_emergencyPhysicianId_idx" ON "SpecialistReferral"("emergencyPhysicianId");

-- CreateTable
CREATE TABLE "EmergencyPhysician" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyPhysician_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SpecialistReferral" ADD CONSTRAINT "SpecialistReferral_emergencyPhysicianId_fkey" FOREIGN KEY ("emergencyPhysicianId") REFERENCES "EmergencyPhysician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PasteurWorkReport" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "patientName" TEXT,
    "patientPhone" TEXT,
    "followUpDate" DATE,
    "followUpNotes" TEXT,
    "details" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasteurWorkReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PasteurWorkReport_followUpDate_idx" ON "PasteurWorkReport"("followUpDate");
CREATE INDEX "PasteurWorkReport_createdAt_idx" ON "PasteurWorkReport"("createdAt");
