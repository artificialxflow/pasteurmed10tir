ALTER TABLE "NursingItem" ADD COLUMN IF NOT EXISTS "emoji" TEXT NOT NULL DEFAULT '🩺';
UPDATE "NursingItem" SET "emoji" = '🩺' WHERE "emoji" = '';
