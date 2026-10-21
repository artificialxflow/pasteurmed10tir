-- CreateEnum
CREATE TYPE "VisitorRole" AS ENUM ('visitor', 'referrer');

-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN "role" "VisitorRole" NOT NULL DEFAULT 'visitor';

-- CreateIndex
CREATE INDEX "Consultation_doctorId_preferredDate_preferredTime_idx" ON "Consultation"("doctorId", "preferredDate", "preferredTime");
