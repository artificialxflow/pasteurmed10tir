-- CreateEnum
CREATE TYPE "AcquisitionSource" AS ENUM ('social_media', 'google', 'outdoor_ads', 'previous_visitors', 'acquaintances');

-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN "acquisitionSource" "AcquisitionSource";

-- CreateIndex
CREATE INDEX "PatientProfile_acquisitionSource_idx" ON "PatientProfile"("acquisitionSource");

-- CreateIndex
CREATE INDEX "PatientProfile_createdAt_idx" ON "PatientProfile"("createdAt");
