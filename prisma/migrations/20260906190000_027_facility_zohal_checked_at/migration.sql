-- AlterTable
-- زمان آخرین استعلام زحل روی درخواست تسهیلات، تا پرسنل داده کهنه را از
-- نتیجه تازه تشخیص بدهند. `MembershipApplication` این ستون را از قبل داشت.
ALTER TABLE "FacilityRequest" ADD COLUMN "zohalCheckedAt" TIMESTAMP(3);
