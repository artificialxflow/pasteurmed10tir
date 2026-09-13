-- CreateTable
CREATE TABLE IF NOT EXISTS "HealthRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "freeVisitsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "HealthRecordEntry" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "payload" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthRecordEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "HealthRecordAttachment" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthRecordAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HealthRecord_userId_key" ON "HealthRecord"("userId");
CREATE INDEX IF NOT EXISTS "HealthRecordEntry_recordId_section_idx" ON "HealthRecordEntry"("recordId", "section");
CREATE INDEX IF NOT EXISTS "HealthRecordEntry_entryDate_idx" ON "HealthRecordEntry"("entryDate");
CREATE INDEX IF NOT EXISTS "HealthRecordAttachment_entryId_idx" ON "HealthRecordAttachment"("entryId");

DO $$ BEGIN
  ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "HealthRecordEntry" ADD CONSTRAINT "HealthRecordEntry_recordId_fkey"
    FOREIGN KEY ("recordId") REFERENCES "HealthRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "HealthRecordAttachment" ADD CONSTRAINT "HealthRecordAttachment_entryId_fkey"
    FOREIGN KEY ("entryId") REFERENCES "HealthRecordEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
