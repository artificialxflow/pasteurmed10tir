-- CreateTable
CREATE TABLE "CreditActivationRequest" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "patientName" TEXT,
    "nationalId" TEXT,
    "requestedAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "linkedPlanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deleteNote" TEXT,

    CONSTRAINT "CreditActivationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditActivationRequest_phone_idx" ON "CreditActivationRequest"("phone");

-- CreateIndex
CREATE INDEX "CreditActivationRequest_status_idx" ON "CreditActivationRequest"("status");

-- CreateIndex
CREATE INDEX "CreditActivationRequest_deletedAt_idx" ON "CreditActivationRequest"("deletedAt");
