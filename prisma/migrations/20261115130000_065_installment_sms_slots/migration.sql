-- updates/35/05 — یادآوری ۵ و ۲ روز قبل/بعد
ALTER TABLE "InstallmentScheduleItem" ADD COLUMN IF NOT EXISTS "dueSms5dSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InstallmentScheduleItem" ADD COLUMN IF NOT EXISTS "dueSms2dSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InstallmentScheduleItem" ADD COLUMN IF NOT EXISTS "overdueSms2dSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InstallmentScheduleItem" ADD COLUMN IF NOT EXISTS "overdueSms5dSent" BOOLEAN NOT NULL DEFAULT false;