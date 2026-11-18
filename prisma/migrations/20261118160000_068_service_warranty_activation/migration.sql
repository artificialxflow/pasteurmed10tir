-- فعال‌سازی کارت گارانتی توسط بیمار در پنل
CREATE TYPE "ServiceWarrantyStatus" AS ENUM ('pending', 'active');

ALTER TABLE "ServiceWarrantyCard" ADD COLUMN "status" "ServiceWarrantyStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "ServiceWarrantyCard" ADD COLUMN "activatedAt" TIMESTAMP(3);

UPDATE "ServiceWarrantyCard"
SET "status" = 'active',
    "activatedAt" = COALESCE("startedAt", "createdAt")
WHERE "activatedAt" IS NULL;

CREATE INDEX "ServiceWarrantyCard_status_idx" ON "ServiceWarrantyCard"("status");