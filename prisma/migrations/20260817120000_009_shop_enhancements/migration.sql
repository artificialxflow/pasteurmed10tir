-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");

-- Seed default categories
INSERT INTO "ProductCategory" ("name", "slug", "sortOrder", "active") VALUES
('دندانپزشکی', 'dentistry', 1, true),
('پزشکی', 'medical', 2, true);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "slug" TEXT,
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "categoryId" INTEGER,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Replace external image URLs
UPDATE "Product" SET "image" = '/uploads/placeholder.svg' WHERE "image" LIKE 'http%';

-- Backfill category links
UPDATE "Product" SET "categoryId" = (SELECT "id" FROM "ProductCategory" WHERE "name" = 'دندانپزشکی' LIMIT 1)
WHERE "category" = 'دندانپزشکی';

UPDATE "Product" SET "categoryId" = (SELECT "id" FROM "ProductCategory" WHERE "name" = 'پزشکی' LIMIT 1)
WHERE "category" = 'پزشکی';

UPDATE "Product" SET "categoryId" = (SELECT "id" FROM "ProductCategory" WHERE "name" = 'دندانپزشکی' LIMIT 1)
WHERE "categoryId" IS NULL;

-- Backfill images array
UPDATE "Product" SET "images" = ARRAY["image"] WHERE "image" IS NOT NULL AND "image" <> '';

-- Backfill slug from id (admin can edit later)
UPDATE "Product" SET "slug" = 'product-' || "id"::text WHERE "slug" IS NULL OR "slug" = '';

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
