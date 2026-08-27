-- Installment SMS reminder flags (updates/10/07)
ALTER TABLE "InstallmentScheduleItem" ADD COLUMN IF NOT EXISTS "dueReminderSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InstallmentScheduleItem" ADD COLUMN IF NOT EXISTS "lastOverdueSmsAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "InstallmentScheduleItem_dueReminderSent_dueDate_idx"
  ON "InstallmentScheduleItem"("dueReminderSent", "dueDate");

CREATE INDEX IF NOT EXISTS "InstallmentScheduleItem_lastOverdueSmsAt_idx"
  ON "InstallmentScheduleItem"("lastOverdueSmsAt");
