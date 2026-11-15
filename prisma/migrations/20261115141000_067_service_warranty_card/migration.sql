-- CreateEnum
CREATE TYPE "ServiceWarrantyType" AS ENUM (
  'root_canal',
  'crown',
  'implant',
  'laminate_composite',
  'denture',
  'orthodontics'
);

CREATE TABLE "ServiceWarrantyCard" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "serviceType" "ServiceWarrantyType" NOT NULL,
  "serviceLabel" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ServiceWarrantyCard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceWarrantyCard_userId_idx" ON "ServiceWarrantyCard"("userId");
CREATE INDEX "ServiceWarrantyCard_expiresAt_idx" ON "ServiceWarrantyCard"("expiresAt");

ALTER TABLE "ServiceWarrantyCard" ADD CONSTRAINT "ServiceWarrantyCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;