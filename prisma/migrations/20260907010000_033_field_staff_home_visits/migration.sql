-- CreateEnum
CREATE TYPE "FieldStaffKind" AS ENUM ('nurse', 'physician');

-- CreateEnum
CREATE TYPE "FieldStaffStatus" AS ENUM ('available', 'busy', 'inactive');

-- CreateEnum
CREATE TYPE "HomeVisitKind" AS ENUM ('nursing', 'medical_home');

-- CreateEnum
CREATE TYPE "HomeVisitStatus" AS ENUM ('submitted', 'staff_assigned', 'staff_confirmed', 'en_route', 'completed', 'reviewed', 'cancelled');

-- CreateTable
CREATE TABLE "FieldStaff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "FieldStaffKind" NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "specialty" TEXT NOT NULL DEFAULT '',
    "serviceAreas" TEXT[],
    "status" "FieldStaffStatus" NOT NULL DEFAULT 'available',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeVisitRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "patientPhone" TEXT NOT NULL,
    "patientName" TEXT,
    "kind" "HomeVisitKind" NOT NULL,
    "serviceTitle" TEXT NOT NULL DEFAULT '',
    "specialtyLabel" TEXT,
    "description" TEXT,
    "patientAddress" TEXT NOT NULL,
    "patientArea" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "consultationId" TEXT,
    "assignedStaffId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "status" "HomeVisitStatus" NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeVisitRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FieldStaff_kind_active_status_idx" ON "FieldStaff"("kind", "active", "status");

-- CreateIndex
CREATE INDEX "FieldStaff_sortOrder_idx" ON "FieldStaff"("sortOrder");

-- CreateIndex
CREATE INDEX "HomeVisitRequest_userId_idx" ON "HomeVisitRequest"("userId");

-- CreateIndex
CREATE INDEX "HomeVisitRequest_patientPhone_idx" ON "HomeVisitRequest"("patientPhone");

-- CreateIndex
CREATE INDEX "HomeVisitRequest_status_idx" ON "HomeVisitRequest"("status");

-- CreateIndex
CREATE INDEX "HomeVisitRequest_kind_idx" ON "HomeVisitRequest"("kind");

-- CreateIndex
CREATE INDEX "HomeVisitRequest_assignedStaffId_idx" ON "HomeVisitRequest"("assignedStaffId");

-- CreateIndex
CREATE INDEX "HomeVisitRequest_consultationId_idx" ON "HomeVisitRequest"("consultationId");

-- AddForeignKey
ALTER TABLE "HomeVisitRequest" ADD CONSTRAINT "HomeVisitRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisitRequest" ADD CONSTRAINT "HomeVisitRequest_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "FieldStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
