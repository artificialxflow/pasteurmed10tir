-- Split doctor review approval: rating vs comment (follow-up + patient)

ALTER TABLE "DoctorReview" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'patient';
ALTER TABLE "DoctorReview" ADD COLUMN IF NOT EXISTS "ratingStatus" "ReviewStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "DoctorReview" ADD COLUMN IF NOT EXISTS "commentStatus" "ReviewStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "DoctorReview" ADD COLUMN IF NOT EXISTS "showSubmitterOnSite" BOOLEAN NOT NULL DEFAULT true;

UPDATE "DoctorReview"
SET
  "ratingStatus" = "status",
  "commentStatus" = "status";

CREATE INDEX IF NOT EXISTS "DoctorReview_ratingStatus_idx" ON "DoctorReview"("ratingStatus");
CREATE INDEX IF NOT EXISTS "DoctorReview_commentStatus_idx" ON "DoctorReview"("commentStatus");
CREATE INDEX IF NOT EXISTS "DoctorReview_source_idx" ON "DoctorReview"("source");
