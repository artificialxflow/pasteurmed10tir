-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentIntent" (
    "id" TEXT NOT NULL,
    "trackId" TEXT,
    "amountRial" INTEGER NOT NULL,
    "amountToman" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "resultPayload" JSONB,
    "successPath" TEXT NOT NULL,
    "failPath" TEXT NOT NULL,
    "basePath" TEXT NOT NULL DEFAULT '/dental',
    "refNumber" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_trackId_key" ON "PaymentIntent"("trackId");
CREATE INDEX IF NOT EXISTS "PaymentIntent_status_idx" ON "PaymentIntent"("status");
CREATE INDEX IF NOT EXISTS "PaymentIntent_createdAt_idx" ON "PaymentIntent"("createdAt");
