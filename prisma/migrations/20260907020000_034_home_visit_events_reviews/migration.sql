-- CreateTable
CREATE TABLE "HomeVisitStatusEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" "HomeVisitStatus" NOT NULL,
    "adminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeVisitStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "requestId" TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "staffKind" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeVisitStatusEvent_requestId_createdAt_idx" ON "HomeVisitStatusEvent"("requestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceReview_requestId_key" ON "ServiceReview"("requestId");

-- CreateIndex
CREATE INDEX "ServiceReview_userId_idx" ON "ServiceReview"("userId");

-- CreateIndex
CREATE INDEX "ServiceReview_status_idx" ON "ServiceReview"("status");

-- AddForeignKey
ALTER TABLE "HomeVisitStatusEvent" ADD CONSTRAINT "HomeVisitStatusEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HomeVisitRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HomeVisitRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
