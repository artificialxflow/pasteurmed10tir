-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "shopFeaturedProductIds" JSONB NOT NULL DEFAULT '[]';
