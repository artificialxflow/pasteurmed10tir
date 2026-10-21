-- AlterEnum
ALTER TYPE "AcquisitionSource" ADD VALUE 'organizational_contracts';
ALTER TYPE "AcquisitionSource" ADD VALUE 'clinic_patient';

-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN "referralCode" TEXT;
CREATE INDEX "PatientProfile_referralCode_idx" ON "PatientProfile"("referralCode");

ALTER TABLE "DentalTariffCategory" ADD COLUMN "image" TEXT;

ALTER TABLE "FollowUpCase" ADD COLUMN "referralLikelihood" INTEGER;

ALTER TABLE "MarketingReport" ADD COLUMN "successNotes" TEXT;

ALTER TABLE "PasteurWorkReport" ADD COLUMN "reportedAt" TIMESTAMP(3);
ALTER TABLE "PasteurWorkReport" ADD COLUMN "payloadJson" JSONB;
CREATE INDEX "PasteurWorkReport_reportedAt_idx" ON "PasteurWorkReport"("reportedAt");

-- CreateTable
CREATE TABLE "CompetitorClinic" (
    "id" TEXT NOT NULL,
    "clinicName" TEXT NOT NULL,
    "managementName" TEXT,
    "city" TEXT,
    "region" TEXT,
    "moreSpecializedPct" INTEGER,
    "services" TEXT,
    "equipment" TEXT,
    "generalDentistCount" INTEGER,
    "specialistDentistCount" INTEGER,
    "website" TEXT,
    "websiteDomain" TEXT,
    "onlineServices" TEXT,
    "instagramPage" TEXT,
    "followerCount" INTEGER,
    "engagementRate" INTEGER,
    "contentType" TEXT,
    "mapsFeedback" TEXT,
    "commentReaction" TEXT,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "strategyScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorClinic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetitorClinicPrice" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "dentalTariffItemId" TEXT NOT NULL,
    "priceNum" INTEGER,

    CONSTRAINT "CompetitorClinicPrice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompetitorClinic_clinicName_idx" ON "CompetitorClinic"("clinicName");
CREATE INDEX "CompetitorClinic_city_idx" ON "CompetitorClinic"("city");
CREATE INDEX "CompetitorClinic_updatedAt_idx" ON "CompetitorClinic"("updatedAt");
CREATE UNIQUE INDEX "CompetitorClinicPrice_competitorId_dentalTariffItemId_key" ON "CompetitorClinicPrice"("competitorId", "dentalTariffItemId");
CREATE INDEX "CompetitorClinicPrice_competitorId_idx" ON "CompetitorClinicPrice"("competitorId");
CREATE INDEX "CompetitorClinicPrice_dentalTariffItemId_idx" ON "CompetitorClinicPrice"("dentalTariffItemId");

ALTER TABLE "CompetitorClinicPrice" ADD CONSTRAINT "CompetitorClinicPrice_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "CompetitorClinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitorClinicPrice" ADD CONSTRAINT "CompetitorClinicPrice_dentalTariffItemId_fkey" FOREIGN KEY ("dentalTariffItemId") REFERENCES "DentalTariffItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ConsultationType: remove legacy image row; normalize labels
DELETE FROM "ConsultationType" WHERE "id" = 'image';

UPDATE "ConsultationType" SET "label" = 'مشاوره تصویری', "desc" = 'تصویر + متن + صوت — ویزیت تصویری', "priceNum" = 1000000, "price" = '۱,۰۰۰,۰۰۰ تومان' WHERE "id" = 'video';
UPDATE "ConsultationType" SET "label" = 'ویزیت اورژانسی', "desc" = 'متن + صوت + تصویر — ویزیت اورژانسی فوری', "priceNum" = 1300000, "price" = '۱,۳۰۰,۰۰۰ تومان' WHERE "id" = 'emergency';

-- MembershipPlan prices
UPDATE "MembershipPlan" SET "priceNum" = 1000000, "price" = '۱,۰۰۰,۰۰۰' WHERE "id" = 'regular';
UPDATE "MembershipPlan" SET "priceNum" = 2000000, "price" = '۲,۰۰۰,۰۰۰' WHERE "id" = 'vip';
