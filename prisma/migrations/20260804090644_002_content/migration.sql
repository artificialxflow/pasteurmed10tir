-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🧩',
    "description" TEXT NOT NULL DEFAULT '',
    "href" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'teal',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaserService" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '✨',
    "price" TEXT NOT NULL,
    "priceNum" INTEGER,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LaserService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NursingService" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NursingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NursingItem" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priceNum" INTEGER NOT NULL,
    "price" TEXT,
    "unit" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NursingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Physician" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "specialtyId" TEXT,
    "image" TEXT NOT NULL,
    "days" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'available',

    CONSTRAINT "Physician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "before" TEXT NOT NULL,
    "after" TEXT NOT NULL,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "priceNum" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseInsurance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BaseInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplementaryInsurance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ComplementaryInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationType" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "priceNum" INTEGER,
    "price" TEXT,

    CONSTRAINT "ConsultationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "dentalReservationFee" INTEGER NOT NULL DEFAULT 200000,
    "walletRegularCap" INTEGER NOT NULL DEFAULT 15000000,
    "walletMembershipVipCap" INTEGER NOT NULL DEFAULT 30000000,
    "walletShopVipCap" INTEGER NOT NULL DEFAULT 20000000,
    "walletGraceMonths" INTEGER NOT NULL DEFAULT 1,
    "walletInstallmentMin" INTEGER NOT NULL DEFAULT 4,
    "walletInstallmentMax" INTEGER NOT NULL DEFAULT 6,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialtyTariff" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "tariffs" JSONB NOT NULL,

    CONSTRAINT "SpecialtyTariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NursingItem_serviceId_idx" ON "NursingItem"("serviceId");

-- AddForeignKey
ALTER TABLE "NursingItem" ADD CONSTRAINT "NursingItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "NursingService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
