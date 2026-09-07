-- CreateTable
CREATE TABLE "LoanDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "phone" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LoanDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanDocument_applicationId_idx" ON "LoanDocument"("applicationId");

-- CreateIndex
CREATE INDEX "LoanDocument_phone_idx" ON "LoanDocument"("phone");

-- CreateIndex
CREATE INDEX "LoanDocument_kind_idx" ON "LoanDocument"("kind");

-- CreateIndex
CREATE INDEX "LoanDocument_deletedAt_idx" ON "LoanDocument"("deletedAt");

-- AddForeignKey
ALTER TABLE "LoanDocument" ADD CONSTRAINT "LoanDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MembershipApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
