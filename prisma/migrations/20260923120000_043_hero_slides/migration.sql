-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "heroSlides" JSONB NOT NULL DEFAULT '[]';
