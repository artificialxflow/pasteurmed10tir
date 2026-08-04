-- CreateEnum (idempotent)
DO $$ BEGIN CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ConsultationStatus" AS ENUM ('pending', 'answered'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "InsuranceInquiryStatus" AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'hidden'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ComplaintStatus" AS ENUM ('new', 'reviewing', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "PartnerRequestStatus" AS ENUM ('new', 'reviewing', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ReminderStatus" AS ENUM ('active', 'cancelled', 'sent'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "patientPhone" TEXT NOT NULL,
    "patientName" TEXT,
    "doctorId" TEXT,
    "doctorName" TEXT,
    "specialty" TEXT,
    "type" TEXT,
    "typeLabel" TEXT,
    "day" TEXT,
    "timeValue" TEXT,
    "timeLabel" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "isDeposit" BOOLEAN NOT NULL DEFAULT true,
    "depositNonRefundable" BOOLEAN NOT NULL DEFAULT true,
    "status" "BookingStatus" NOT NULL DEFAULT 'confirmed',
    "dateLabel" TEXT,
    "referralCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Consultation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "patientPhone" TEXT NOT NULL,
    "patientName" TEXT,
    "type" TEXT,
    "typeLabel" TEXT,
    "category" TEXT,
    "categoryLabel" TEXT,
    "specialty" TEXT,
    "specialtyLabel" TEXT,
    "doctorId" TEXT,
    "doctorName" TEXT,
    "description" TEXT,
    "estimate" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "priceSource" TEXT,
    "hasImage" BOOLEAN NOT NULL DEFAULT false,
    "onlineInsuranceCovered" BOOLEAN NOT NULL DEFAULT false,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InsuranceInquiry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "patientPhone" TEXT NOT NULL,
    "patientName" TEXT,
    "mode" TEXT NOT NULL,
    "baseInsuranceId" TEXT,
    "complementaryInsuranceId" TEXT,
    "franchisePercent" INTEGER NOT NULL DEFAULT 30,
    "visitFee" INTEGER NOT NULL DEFAULT 0,
    "depositAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "InsuranceInquiryStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "InsuranceInquiry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "bookingId" TEXT,
    "patientPhone" TEXT NOT NULL,
    "patientName" TEXT,
    "doctorName" TEXT,
    "day" TEXT,
    "timeLabel" TEXT,
    "typeLabel" TEXT,
    "optionId" TEXT,
    "optionLabel" TEXT,
    "status" "ReminderStatus" NOT NULL DEFAULT 'active',
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DoctorReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "patientPhone" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "doctorKind" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DoctorReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Complaint" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "patientPhone" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PartnerRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "typeLabel" TEXT,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "specialty" TEXT,
    "city" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "status" "PartnerRequestStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX IF NOT EXISTS "Booking_patientPhone_idx" ON "Booking"("patientPhone");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_doctorId_day_type_idx" ON "Booking"("doctorId", "day", "type");
CREATE INDEX IF NOT EXISTS "Consultation_userId_idx" ON "Consultation"("userId");
CREATE INDEX IF NOT EXISTS "Consultation_patientPhone_idx" ON "Consultation"("patientPhone");
CREATE INDEX IF NOT EXISTS "Consultation_status_idx" ON "Consultation"("status");
CREATE INDEX IF NOT EXISTS "InsuranceInquiry_userId_idx" ON "InsuranceInquiry"("userId");
CREATE INDEX IF NOT EXISTS "InsuranceInquiry_patientPhone_idx" ON "InsuranceInquiry"("patientPhone");
CREATE INDEX IF NOT EXISTS "InsuranceInquiry_status_idx" ON "InsuranceInquiry"("status");
CREATE INDEX IF NOT EXISTS "Reminder_userId_idx" ON "Reminder"("userId");
CREATE INDEX IF NOT EXISTS "Reminder_bookingId_idx" ON "Reminder"("bookingId");
CREATE INDEX IF NOT EXISTS "DoctorReview_userId_idx" ON "DoctorReview"("userId");
CREATE INDEX IF NOT EXISTS "DoctorReview_status_idx" ON "DoctorReview"("status");
CREATE INDEX IF NOT EXISTS "Complaint_userId_idx" ON "Complaint"("userId");
CREATE INDEX IF NOT EXISTS "Complaint_status_idx" ON "Complaint"("status");
CREATE INDEX IF NOT EXISTS "PartnerRequest_status_idx" ON "PartnerRequest"("status");

DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "InsuranceInquiry" ADD CONSTRAINT "InsuranceInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "DoctorReview" ADD CONSTRAINT "DoctorReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
