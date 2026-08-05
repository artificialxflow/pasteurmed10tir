/**
 * DANGER — Dev/staging only.
 *
 * Truncates application data while KEEPING AdminRole + AdminUser.
 * Does NOT touch env files. Never run against public production without explicit approval.
 *
 * Usage:
 *   npx tsx scripts/reset-all.ts
 *   npx tsx scripts/reset-all.ts --confirm
 *
 * Without --confirm the script aborts (safety).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error(
      'Refusing to run. Pass --confirm to truncate data (AdminRole/AdminUser kept).\n' +
        'Example: npx tsx scripts/reset-all.ts --confirm',
    );
    process.exit(1);
  }

  console.log('Resetting application data (admins preserved)...');

  // Order: dependents first
  await prisma.clubHistoryItem.deleteMany();
  await prisma.clubProfile.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.shopOrder.deleteMany();
  await prisma.installmentPlan.deleteMany();
  await prisma.facilityRequest.deleteMany();
  await prisma.membershipApplication.deleteMany();
  await prisma.member.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.insuranceInquiry.deleteMany();
  await prisma.doctorReview.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.partnerRequest.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mediaAsset.deleteMany();

  // Catalog / content optional wipe (re-seed with phase2 afterward)
  await prisma.nursingItem.deleteMany();
  await prisma.nursingService.deleteMany();
  await prisma.laserService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.physician.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.baseInsurance.deleteMany();
  await prisma.complementaryInsurance.deleteMany();
  await prisma.consultationType.deleteMany();
  await prisma.specialtyTariff.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.visitor.deleteMany();

  // Keep SiteSettings row structure — reset to defaults if present
  await prisma.siteSettings.deleteMany();
  await prisma.siteSettings.create({
    data: { id: 'default' },
  });

  const adminCount = await prisma.adminUser.count();
  const roleCount = await prisma.adminRole.count();
  console.log(`Done. AdminUser=${adminCount}, AdminRole=${roleCount} retained.`);
  console.log('Re-seed: npm run db:seed && npm run db:seed:phase2 && …');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
