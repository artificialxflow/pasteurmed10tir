-- AlterTable
ALTER TABLE "Product" ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "size" TEXT NOT NULL DEFAULT '';
