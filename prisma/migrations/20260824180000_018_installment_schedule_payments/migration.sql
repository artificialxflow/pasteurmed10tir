-- CreateEnum
CREATE TYPE "InstallmentItemStatus" AS ENUM ('pending', 'due', 'overdue', 'paid', 'partial');

-- CreateEnum
CREATE TYPE "InstallmentPaymentMethod" AS ENUM ('zibal', 'wallet', 'manual');

-- CreateEnum
CREATE TYPE "InstallmentPaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "InstallmentScheduleItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "InstallmentItemStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallmentScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallmentPayment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "scheduleItemId" TEXT,
    "amount" INTEGER NOT NULL,
    "method" "InstallmentPaymentMethod" NOT NULL,
    "status" "InstallmentPaymentStatus" NOT NULL DEFAULT 'pending',
    "trackId" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallmentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstallmentScheduleItem_planId_index_key" ON "InstallmentScheduleItem"("planId", "index");

-- CreateIndex
CREATE INDEX "InstallmentScheduleItem_planId_idx" ON "InstallmentScheduleItem"("planId");

-- CreateIndex
CREATE INDEX "InstallmentScheduleItem_status_idx" ON "InstallmentScheduleItem"("status");

-- CreateIndex
CREATE INDEX "InstallmentScheduleItem_dueDate_idx" ON "InstallmentScheduleItem"("dueDate");

-- CreateIndex
CREATE INDEX "InstallmentPayment_planId_idx" ON "InstallmentPayment"("planId");

-- CreateIndex
CREATE INDEX "InstallmentPayment_scheduleItemId_idx" ON "InstallmentPayment"("scheduleItemId");

-- CreateIndex
CREATE INDEX "InstallmentPayment_status_idx" ON "InstallmentPayment"("status");

-- CreateIndex
CREATE INDEX "InstallmentPayment_trackId_idx" ON "InstallmentPayment"("trackId");

-- AddForeignKey
ALTER TABLE "InstallmentScheduleItem" ADD CONSTRAINT "InstallmentScheduleItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_scheduleItemId_fkey" FOREIGN KEY ("scheduleItemId") REFERENCES "InstallmentScheduleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
