-- CreateEnum
CREATE TYPE "FollowUpServiceCategory" AS ENUM ('dental', 'medical', 'nursing', 'laser');

CREATE TYPE "FollowUpOutcome" AS ENUM ('attended', 'no_show', 'dissatisfied');

CREATE TYPE "FollowUpAttendedAction" AS ENUM ('appointment_needed', 'follow_up_needed');

CREATE TYPE "FollowUpDissatisfactionTarget" AS ENUM ('doctor', 'staff', 'environment');

-- CreateTable
CREATE TABLE "SpecialistReferral" (
    "id" TEXT NOT NULL,
    "referrerName" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "specialistName" TEXT NOT NULL,
    "note" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialistReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpCase" (
    "id" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "serviceCategory" "FollowUpServiceCategory" NOT NULL,
    "satisfactionDoctor" INTEGER,
    "satisfactionAssistants" INTEGER,
    "satisfactionReception" INTEGER,
    "outcome" "FollowUpOutcome" NOT NULL,
    "attendedAction" "FollowUpAttendedAction",
    "dissatisfactionTarget" "FollowUpDissatisfactionTarget",
    "followUpDate" DATE,
    "appointmentGiven" BOOLEAN NOT NULL DEFAULT false,
    "followUpDone" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecialistReferral_patientPhone_idx" ON "SpecialistReferral"("patientPhone");
CREATE INDEX "SpecialistReferral_createdAt_idx" ON "SpecialistReferral"("createdAt");

CREATE INDEX "FollowUpCase_patientPhone_idx" ON "FollowUpCase"("patientPhone");
CREATE INDEX "FollowUpCase_workDate_idx" ON "FollowUpCase"("workDate");
CREATE INDEX "FollowUpCase_followUpDate_idx" ON "FollowUpCase"("followUpDate");
CREATE INDEX "FollowUpCase_outcome_idx" ON "FollowUpCase"("outcome");
CREATE INDEX "FollowUpCase_appointmentGiven_idx" ON "FollowUpCase"("appointmentGiven");
CREATE INDEX "FollowUpCase_followUpDone_idx" ON "FollowUpCase"("followUpDone");
