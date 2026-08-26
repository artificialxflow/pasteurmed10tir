-- AlterTable
ALTER TABLE "Physician" ADD COLUMN "medicalCouncilNumber" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Dentist" ADD COLUMN "medicalCouncilNumber" TEXT NOT NULL DEFAULT '';
