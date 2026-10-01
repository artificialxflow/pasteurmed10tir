-- CreateEnum
CREATE TYPE "ConsultationVideoStatus" AS ENUM ('none', 'scheduled', 'in_call', 'completed');

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN "videoRoomName" TEXT;
ALTER TABLE "Consultation" ADD COLUMN "videoStatus" "ConsultationVideoStatus" NOT NULL DEFAULT 'none';

-- CreateIndex
CREATE INDEX "Consultation_videoStatus_idx" ON "Consultation"("videoStatus");
