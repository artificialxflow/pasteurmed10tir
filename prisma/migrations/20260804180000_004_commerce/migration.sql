-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'paid');

-- CreateEnum
CREATE TYPE "FacilityRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "InstallmentSource" AS ENUM ('credit', 'facility', 'membership', 'wallet');

-- CreateEnum
CREATE TYPE "InstallmentPlanStatus" AS ENUM ('active', 'completed', 'overdue', 'hidden');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('active', 'suspended', 'closed');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('credit', 'debit', 'upgrade', 'adjustment');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ShopOrderStatus" AS ENUM ('pending', 'confirmed', 'shipped', 'cancelled');

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "priceNum" INTEGER NOT NULL,
    "loanTermLabel" TEXT NOT NULL,
    "loanLimit" INTEGER NOT NULL,
    "downPaymentPercent" INTEGER NOT NULL DEFAULT 30,
    "features" TEXT[],
    "terms" TEXT NOT NULL DEFAULT '',
    "highlighted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "planId" TEXT,
    "planName" TEXT,
    "patientName" TEXT,
    "patientPhone" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "validityLabel" TEXT,
    "membershipDurationLabel" TEXT,
    "discountPercent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipApplication" (
    "id" TEXT NOT NULL,
    "patientName" TEXT,
    "phone" TEXT,
    "nationalId" TEXT,
    "age" TEXT,
    "job" TEXT,
    "postalCode" TEXT,
    "homeAddress" TEXT,
    "workAddress" TEXT,
    "medicalHistory" TEXT,
    "dependents" TEXT,
    "planId" TEXT,
    "planTitle" TEXT,
    "tier" TEXT,
    "tierLabel" TEXT,
    "validityLabel" TEXT,
    "membershipDurationLabel" TEXT,
    "discountPercent" INTEGER,
    "memberCount" INTEGER,
    "unitPriceToman" INTEGER,
    "amountRial" INTEGER,
    "amountToman" INTEGER,
    "loanAmount" INTEGER,
    "referralCode" TEXT,
    "visitorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT,
    "date" TEXT,
    "extra" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "ceiling" INTEGER NOT NULL DEFAULT 15000000,
    "activeKinds" TEXT[] DEFAULT ARRAY['regular']::TEXT[],
    "status" "WalletStatus" NOT NULL DEFAULT 'active',
    "shopVip" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("phone")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletPhone" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerType" TEXT,
    "customerTypeLabel" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT NOT NULL,
    "address" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "status" "ShopOrderStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "commissionRate" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "VisitorStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "visitorId" INTEGER NOT NULL,
    "visitorName" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "commissionRate" INTEGER NOT NULL,
    "commissionAmount" INTEGER NOT NULL,
    "sourceType" TEXT,
    "sourceLabel" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "amount" TEXT NOT NULL DEFAULT '',
    "amountNum" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" "FacilityRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallmentPlan" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "patientName" TEXT,
    "source" "InstallmentSource" NOT NULL,
    "title" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "installmentCount" INTEGER NOT NULL,
    "dueDates" TEXT[],
    "status" "InstallmentPlanStatus" NOT NULL DEFAULT 'active',
    "linkedRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Member_userId_idx" ON "Member"("userId");
CREATE INDEX "Member_patientPhone_idx" ON "Member"("patientPhone");
CREATE INDEX "Member_status_idx" ON "Member"("status");
CREATE INDEX "MembershipApplication_phone_idx" ON "MembershipApplication"("phone");
CREATE INDEX "MembershipApplication_status_idx" ON "MembershipApplication"("status");
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");
CREATE INDEX "Wallet_status_idx" ON "Wallet"("status");
CREATE INDEX "WalletTransaction_walletPhone_idx" ON "WalletTransaction"("walletPhone");
CREATE INDEX "ShopOrder_userId_idx" ON "ShopOrder"("userId");
CREATE INDEX "ShopOrder_customerPhone_idx" ON "ShopOrder"("customerPhone");
CREATE INDEX "ShopOrder_status_idx" ON "ShopOrder"("status");
CREATE UNIQUE INDEX "Visitor_code_key" ON "Visitor"("code");
CREATE INDEX "Commission_visitorId_idx" ON "Commission"("visitorId");
CREATE INDEX "Commission_referralCode_idx" ON "Commission"("referralCode");
CREATE INDEX "Commission_status_idx" ON "Commission"("status");
CREATE INDEX "FacilityRequest_phone_idx" ON "FacilityRequest"("phone");
CREATE INDEX "FacilityRequest_status_idx" ON "FacilityRequest"("status");
CREATE INDEX "InstallmentPlan_phone_idx" ON "InstallmentPlan"("phone");
CREATE INDEX "InstallmentPlan_source_idx" ON "InstallmentPlan"("source");
CREATE INDEX "InstallmentPlan_status_idx" ON "InstallmentPlan"("status");
CREATE INDEX "InstallmentPlan_linkedRequestId_idx" ON "InstallmentPlan"("linkedRequestId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletPhone_fkey" FOREIGN KEY ("walletPhone") REFERENCES "Wallet"("phone") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopOrder" ADD CONSTRAINT "ShopOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
