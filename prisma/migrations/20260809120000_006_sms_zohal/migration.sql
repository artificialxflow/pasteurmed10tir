-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "appointmentAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "reminder24Sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "reminder2Sent" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Booking_appointmentAt_idx" ON "Booking"("appointmentAt");

-- AlterTable
ALTER TABLE "FacilityRequest" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;
ALTER TABLE "FacilityRequest" ADD COLUMN IF NOT EXISTS "zohalStatus" TEXT;
ALTER TABLE "FacilityRequest" ADD COLUMN IF NOT EXISTS "zohalPayload" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "OtpChallenge" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OtpChallenge_phone_idx" ON "OtpChallenge"("phone");
CREATE INDEX IF NOT EXISTS "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");
