-- CreateTable
CREATE TABLE "ClubProfile" (
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "referrals" INTEGER NOT NULL DEFAULT 0,
    "referredPhones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "redeemed" JSONB NOT NULL DEFAULT '[]',
    "brushHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubProfile_pkey" PRIMARY KEY ("phone")
);

-- CreateTable
CREATE TABLE "ClubHistoryItem" (
    "id" TEXT NOT NULL,
    "profilePhone" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubHistoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubProfile_userId_key" ON "ClubProfile"("userId");
CREATE INDEX "ClubProfile_userId_idx" ON "ClubProfile"("userId");
CREATE INDEX "ClubProfile_points_idx" ON "ClubProfile"("points");
CREATE INDEX "ClubHistoryItem_profilePhone_idx" ON "ClubHistoryItem"("profilePhone");
CREATE INDEX "ClubHistoryItem_createdAt_idx" ON "ClubHistoryItem"("createdAt");

-- AddForeignKey
ALTER TABLE "ClubProfile" ADD CONSTRAINT "ClubProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClubHistoryItem" ADD CONSTRAINT "ClubHistoryItem_profilePhone_fkey" FOREIGN KEY ("profilePhone") REFERENCES "ClubProfile"("phone") ON DELETE CASCADE ON UPDATE CASCADE;
