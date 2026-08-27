-- CreateTable
CREATE TABLE IF NOT EXISTS "LaserCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '✨',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LaserCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "LaserService" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "laserReservationFee" INTEGER NOT NULL DEFAULT 100000;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LaserService_categoryId_idx" ON "LaserService"("categoryId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LaserService_categoryId_fkey'
  ) THEN
    ALTER TABLE "LaserService"
      ADD CONSTRAINT "LaserService_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "LaserCategory"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
