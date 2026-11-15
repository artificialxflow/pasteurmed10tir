-- updates/35/01-05 — پرداخت حضوری اپراتور
ALTER TABLE "MembershipApplication" ADD COLUMN IF NOT EXISTS "channel" TEXT;
ALTER TABLE "MembershipApplication" ADD COLUMN IF NOT EXISTS "onBehalfUserId" TEXT;
ALTER TABLE "MembershipApplication" ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;

CREATE INDEX IF NOT EXISTS "MembershipApplication_onBehalfUserId_idx" ON "MembershipApplication"("onBehalfUserId");