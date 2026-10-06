-- CreateEnum
CREATE TYPE "MarketingReportKind" AS ENUM ('new_case', 'success', 'follow_up', 'unsuccessful', 'blocked');

CREATE TYPE "MarketingNewCaseOutcome" AS ENUM ('success', 'follow_up', 'unsuccessful', 'blocked');

CREATE TYPE "MarketingUnsuccessfulReason" AS ENUM ('not_approved', 'tariff', 'contract', 'loan_percent', 'discount', 'competitors');

CREATE TYPE "MarketingFollowUpKind" AS ENUM ('catalog', 'call', 'appointment', 'commission', 'no_response', 'in_person');

-- CreateTable
CREATE TABLE "MarketingReport" (
    "id" TEXT NOT NULL,
    "visitorId" INTEGER NOT NULL,
    "visitorPhone" TEXT NOT NULL,
    "kind" "MarketingReportKind" NOT NULL,
    "companyName" TEXT,
    "contactsJson" TEXT,
    "newCaseOutcome" "MarketingNewCaseOutcome",
    "successRequest" BOOLEAN NOT NULL DEFAULT false,
    "successContract" BOOLEAN NOT NULL DEFAULT false,
    "successBanner" BOOLEAN NOT NULL DEFAULT false,
    "successSkin" BOOLEAN NOT NULL DEFAULT false,
    "contractDate" DATE,
    "unsuccessfulReason" "MarketingUnsuccessfulReason",
    "unsuccessfulNotes" TEXT,
    "followUpKind" "MarketingFollowUpKind",
    "followUpDueDate" DATE,
    "blockedNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketingFollowUpSlot" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "doneAt" DATE,
    "note" TEXT,

    CONSTRAINT "MarketingFollowUpSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DentalAssistant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DentalAssistant_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "FollowUpCase" ADD COLUMN "followUpTime" TEXT;
ALTER TABLE "FollowUpCase" ADD COLUMN "assistantNamesJson" TEXT;

-- CreateIndex
CREATE INDEX "MarketingReport_visitorId_idx" ON "MarketingReport"("visitorId");
CREATE INDEX "MarketingReport_visitorPhone_idx" ON "MarketingReport"("visitorPhone");
CREATE INDEX "MarketingReport_kind_idx" ON "MarketingReport"("kind");
CREATE INDEX "MarketingReport_createdAt_idx" ON "MarketingReport"("createdAt");
CREATE INDEX "MarketingReport_followUpDueDate_idx" ON "MarketingReport"("followUpDueDate");

CREATE INDEX "MarketingFollowUpSlot_reportId_idx" ON "MarketingFollowUpSlot"("reportId");
CREATE UNIQUE INDEX "MarketingFollowUpSlot_reportId_slotIndex_key" ON "MarketingFollowUpSlot"("reportId", "slotIndex");

CREATE INDEX "DentalAssistant_active_idx" ON "DentalAssistant"("active");
CREATE INDEX "DentalAssistant_sortOrder_idx" ON "DentalAssistant"("sortOrder");

-- AddForeignKey
ALTER TABLE "MarketingReport" ADD CONSTRAINT "MarketingReport_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketingFollowUpSlot" ADD CONSTRAINT "MarketingFollowUpSlot_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MarketingReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
