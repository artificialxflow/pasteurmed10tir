-- CreateEnum
CREATE TYPE "FieldStaffGender" AS ENUM ('male', 'female');
CREATE TYPE "PreferredStaffGender" AS ENUM ('any', 'male', 'female');

-- AlterTable
ALTER TABLE "CreditActivationRequest" ADD COLUMN "installmentCount" INTEGER;

-- AlterTable
ALTER TABLE "FieldStaff" ADD COLUMN "medicalCouncilNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FieldStaff" ADD COLUMN "gender" "FieldStaffGender";
ALTER TABLE "FieldStaff" ADD COLUMN "commissionPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "HomeVisitRequest" ADD COLUMN "preferredGender" "PreferredStaffGender" NOT NULL DEFAULT 'any';

-- CreateTable
CREATE TABLE "StaffCommission" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "staffKind" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "commissionRate" INTEGER NOT NULL DEFAULT 0,
    "commissionAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffCommission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffCommission_requestId_key" ON "StaffCommission"("requestId");
CREATE INDEX "StaffCommission_staffId_idx" ON "StaffCommission"("staffId");
CREATE INDEX "StaffCommission_staffKind_idx" ON "StaffCommission"("staffKind");
CREATE INDEX "StaffCommission_createdAt_idx" ON "StaffCommission"("createdAt");

ALTER TABLE "StaffCommission" ADD CONSTRAINT "StaffCommission_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "FieldStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
