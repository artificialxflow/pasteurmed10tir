-- CreateTable
CREATE TABLE "Dependent" (
    "id" TEXT NOT NULL,
    "guardianUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationalId" TEXT,
    "birthDate" TIMESTAMP(3),
    "relation" TEXT NOT NULL,
    "fileNumber" TEXT,
    "franchisePercent" INTEGER NOT NULL DEFAULT 10,
    "baseInsuranceId" TEXT,
    "complementaryInsuranceId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "graduatedUserId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dependent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dependent_fileNumber_key" ON "Dependent"("fileNumber");

-- CreateIndex
CREATE INDEX "Dependent_guardianUserId_idx" ON "Dependent"("guardianUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Dependent_nationalId_live_key" ON "Dependent"("nationalId") WHERE "deletedAt" IS NULL AND "nationalId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Dependent_nationalId_idx" ON "Dependent"("nationalId");

-- CreateIndex
CREATE INDEX "Dependent_deletedAt_idx" ON "Dependent"("deletedAt");

-- AddForeignKey
ALTER TABLE "Dependent" ADD CONSTRAINT "Dependent_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "dependentId" TEXT;

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN "dependentId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_dependentId_idx" ON "Booking"("dependentId");

-- CreateIndex
CREATE INDEX "Consultation_dependentId_idx" ON "Consultation"("dependentId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
