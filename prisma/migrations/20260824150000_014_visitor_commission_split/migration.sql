-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN "commissionRateClinical" INTEGER;
ALTER TABLE "Visitor" ADD COLUMN "commissionRateShop" INTEGER;

-- Backfill: keep old rate as clinical; shop defaults to same rate
UPDATE "Visitor" SET "commissionRateClinical" = "commissionRate" WHERE "commissionRateClinical" IS NULL;
UPDATE "Visitor" SET "commissionRateShop" = "commissionRate" WHERE "commissionRateShop" IS NULL;
