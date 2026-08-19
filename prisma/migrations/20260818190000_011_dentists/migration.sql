-- CreateTable
CREATE TABLE "Dentist" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "days" TEXT[],
    "hours" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'available',
    "schedule" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Dentist_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Physician" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
