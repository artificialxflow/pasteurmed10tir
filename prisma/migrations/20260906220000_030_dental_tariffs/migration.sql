-- CreateTable
CREATE TABLE "DentalTariffCategory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🦷',
    "description" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DentalTariffCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DentalTariffItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priceNum" INTEGER NOT NULL,
    "price" TEXT,
    "unit" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DentalTariffItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DentalTariffItem_categoryId_idx" ON "DentalTariffItem"("categoryId");

-- AddForeignKey
ALTER TABLE "DentalTariffItem" ADD CONSTRAINT "DentalTariffItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DentalTariffCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
