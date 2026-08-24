-- AlterTable
ALTER TABLE "Dentist" ADD COLUMN "specialtyId" TEXT;

-- Backfill from specialty label where possible
UPDATE "Dentist" SET "specialtyId" = 'general' WHERE "specialtyId" IS NULL AND ("specialty" ILIKE '%عمومی%' OR "specialty" = 'دندانپزشکی عمومی');
UPDATE "Dentist" SET "specialtyId" = 'orthodontics' WHERE "specialtyId" IS NULL AND "specialty" ILIKE '%ارتودنس%';
UPDATE "Dentist" SET "specialtyId" = 'implant' WHERE "specialtyId" IS NULL AND "specialty" ILIKE '%ایمپلنت%';
UPDATE "Dentist" SET "specialtyId" = 'cosmetic' WHERE "specialtyId" IS NULL AND ("specialty" ILIKE '%زیبایی%' OR "specialty" ILIKE '%لمینت%');
UPDATE "Dentist" SET "specialtyId" = 'oral-surgery' WHERE "specialtyId" IS NULL AND ("specialty" ILIKE '%جراحی%' OR "specialty" ILIKE '%فک%');
UPDATE "Dentist" SET "specialtyId" = 'pediatric' WHERE "specialtyId" IS NULL AND "specialty" ILIKE '%کودک%';
UPDATE "Dentist" SET "specialtyId" = 'endodontics' WHERE "specialtyId" IS NULL AND ("specialty" ILIKE '%ریشه%' OR "specialty" ILIKE '%عصب%');
UPDATE "Dentist" SET "specialtyId" = 'general' WHERE "specialtyId" IS NULL;
