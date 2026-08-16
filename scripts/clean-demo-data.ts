/**
 * Phase R1 — selective demo/seed cleanup (NOT reset-all).
 *
 * Removes:
 *   - Dev patient user/profile (09126723365) and all linked rows
 *   - Obvious seed/demo bookings, consultations, orders, members (by label/source)
 *   - Stale PaymentIntent rows (failed + pending older than 24h)
 *
 * Preserves: AdminUser, AdminRole, catalog/content (services, physicians, products, …)
 *
 * Usage:
 *   npx tsx scripts/clean-demo-data.ts              # dry-run (counts only)
 *   npx tsx scripts/clean-demo-data.ts --confirm    # backup + delete
 *
 * Never run reset-all --confirm on production. This script is selective only.
 */
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const DEV_PHONE = '09126723365';
const STALE_PENDING_MS = 24 * 60 * 60 * 1000;

type DeleteReport = Record<string, number>;

function bump(report: DeleteReport, key: string, n: number) {
  report[key] = (report[key] || 0) + n;
}

function demoConsultationWhere() {
  return {
    OR: [
      { description: { contains: 'seed', mode: 'insensitive' as const } },
      { description: { contains: 'نمونه' } },
    ],
  };
}

function demoMembershipAppWhere() {
  return {
    OR: [
      { source: { startsWith: 'seed' } },
      { source: { contains: 'seed-phase' } },
    ],
  };
}

function demoFacilityWhere() {
  return {
    OR: [
      { description: { contains: 'seed', mode: 'insensitive' as const } },
      { description: { contains: 'نمونه' } },
    ],
  };
}

function demoClubHistoryWhere() {
  return {
    OR: [
      { reason: { contains: 'seed', mode: 'insensitive' as const } },
      { reason: { contains: 'نمونه' } },
    ],
  };
}

async function findDemoShopOrderIds(): Promise<string[]> {
  const rows = await prisma.shopOrder.findMany({
    select: { id: true, address: true, items: true },
  });
  return rows
    .filter((row) => {
      const address = String(row.address || '');
      const itemsJson = JSON.stringify(row.items || []);
      return (
        /seed|نمونه/i.test(address) ||
        itemsJson.includes('seed-item') ||
        itemsJson.includes('محصول نمونه')
      );
    })
    .map((row) => row.id);
}

async function collectBackupSnapshot(phone: string) {
  const demoOrderIds = await findDemoShopOrderIds();
  const stalePendingBefore = new Date(Date.now() - STALE_PENDING_MS);

  return {
    exportedAt: new Date().toISOString(),
    devPhone: phone,
    user: await prisma.user.findUnique({ where: { phone }, include: { profile: true } }),
    devPhoneRows: {
      clubHistoryItem: await prisma.clubHistoryItem.findMany({ where: { profilePhone: phone } }),
      clubProfile: await prisma.clubProfile.findMany({ where: { phone } }),
      walletTransaction: await prisma.walletTransaction.findMany({ where: { walletPhone: phone } }),
      wallet: await prisma.wallet.findMany({ where: { phone } }),
      commission: await prisma.commission.findMany({ where: { customerPhone: phone } }),
      shopOrder: await prisma.shopOrder.findMany({ where: { customerPhone: phone } }),
      installmentPlan: await prisma.installmentPlan.findMany({ where: { phone } }),
      facilityRequest: await prisma.facilityRequest.findMany({ where: { phone } }),
      membershipApplication: await prisma.membershipApplication.findMany({ where: { phone } }),
      member: await prisma.member.findMany({ where: { patientPhone: phone } }),
      reminder: await prisma.reminder.findMany({ where: { patientPhone: phone } }),
      booking: await prisma.booking.findMany({ where: { patientPhone: phone } }),
      consultation: await prisma.consultation.findMany({ where: { patientPhone: phone } }),
      insuranceInquiry: await prisma.insuranceInquiry.findMany({ where: { patientPhone: phone } }),
      doctorReview: await prisma.doctorReview.findMany({ where: { patientPhone: phone } }),
      complaint: await prisma.complaint.findMany({ where: { patientPhone: phone } }),
      partnerRequest: await prisma.partnerRequest.findMany({ where: { patientPhone: phone } }),
      otpChallenge: await prisma.otpChallenge.findMany({ where: { phone } }),
    },
    demoTagged: {
      booking: await prisma.booking.findMany({ where: { doctorName: 'دکتر نمونه' } }),
      consultation: await prisma.consultation.findMany({ where: demoConsultationWhere() }),
      membershipApplication: await prisma.membershipApplication.findMany({
        where: demoMembershipAppWhere(),
      }),
      shopOrder: await prisma.shopOrder.findMany({ where: { id: { in: demoOrderIds } } }),
      facilityRequest: await prisma.facilityRequest.findMany({ where: demoFacilityWhere() }),
      clubHistoryItem: await prisma.clubHistoryItem.findMany({ where: demoClubHistoryWhere() }),
    },
    paymentIntents: {
      failed: await prisma.paymentIntent.findMany({ where: { status: 'failed' } }),
      stalePending: await prisma.paymentIntent.findMany({
        where: { status: 'pending', createdAt: { lt: stalePendingBefore } },
      }),
    },
  };
}

function writeBackup(snapshot: Awaited<ReturnType<typeof collectBackupSnapshot>>): string {
  const dir = path.join(process.cwd(), 'scripts', 'backups');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `clean-demo-${stamp}.json`);
  writeFileSync(file, JSON.stringify(snapshot, null, 2), 'utf8');
  return file;
}

async function deleteDevPhoneData(phone: string, report: DeleteReport, dryRun: boolean) {
  const dryCount = async (label: string, countFn: () => Promise<number>) => {
    bump(report, label, await countFn());
  };

  if (dryRun) {
    await dryCount('clubHistoryItem (dev phone)', () =>
      prisma.clubHistoryItem.count({ where: { profilePhone: phone } }),
    );
    await dryCount('clubProfile (dev phone)', () =>
      prisma.clubProfile.count({ where: { phone } }),
    );
    await dryCount('walletTransaction (dev phone)', () =>
      prisma.walletTransaction.count({ where: { walletPhone: phone } }),
    );
    await dryCount('wallet (dev phone)', () => prisma.wallet.count({ where: { phone } }));
    await dryCount('commission (dev phone)', () =>
      prisma.commission.count({ where: { customerPhone: phone } }),
    );
    await dryCount('shopOrder (dev phone)', () =>
      prisma.shopOrder.count({ where: { customerPhone: phone } }),
    );
    await dryCount('installmentPlan (dev phone)', () =>
      prisma.installmentPlan.count({ where: { phone } }),
    );
    await dryCount('facilityRequest (dev phone)', () =>
      prisma.facilityRequest.count({ where: { phone } }),
    );
    await dryCount('membershipApplication (dev phone)', () =>
      prisma.membershipApplication.count({ where: { phone } }),
    );
    await dryCount('member (dev phone)', () =>
      prisma.member.count({ where: { patientPhone: phone } }),
    );
    await dryCount('reminder (dev phone)', () =>
      prisma.reminder.count({ where: { patientPhone: phone } }),
    );
    await dryCount('booking (dev phone)', () =>
      prisma.booking.count({ where: { patientPhone: phone } }),
    );
    await dryCount('consultation (dev phone)', () =>
      prisma.consultation.count({ where: { patientPhone: phone } }),
    );
    await dryCount('insuranceInquiry (dev phone)', () =>
      prisma.insuranceInquiry.count({ where: { patientPhone: phone } }),
    );
    await dryCount('doctorReview (dev phone)', () =>
      prisma.doctorReview.count({ where: { patientPhone: phone } }),
    );
    await dryCount('complaint (dev phone)', () =>
      prisma.complaint.count({ where: { patientPhone: phone } }),
    );
    await dryCount('partnerRequest (dev phone)', () =>
      prisma.partnerRequest.count({ where: { patientPhone: phone } }),
    );
    await dryCount('otpChallenge (dev phone)', () =>
      prisma.otpChallenge.count({ where: { phone } }),
    );
    await dryCount('user (dev phone)', () => prisma.user.count({ where: { phone } }));
    return;
  }

  const del = async (label: string, fn: () => Promise<{ count: number }>) => {
    const result = await fn();
    bump(report, label, result.count);
  };

  await del('clubHistoryItem (dev phone)', () =>
    prisma.clubHistoryItem.deleteMany({ where: { profilePhone: phone } }),
  );
  await del('clubProfile (dev phone)', () => prisma.clubProfile.deleteMany({ where: { phone } }));
  await del('walletTransaction (dev phone)', () =>
    prisma.walletTransaction.deleteMany({ where: { walletPhone: phone } }),
  );
  await del('wallet (dev phone)', () => prisma.wallet.deleteMany({ where: { phone } }));
  await del('commission (dev phone)', () =>
    prisma.commission.deleteMany({ where: { customerPhone: phone } }),
  );
  await del('shopOrder (dev phone)', () =>
    prisma.shopOrder.deleteMany({ where: { customerPhone: phone } }),
  );
  await del('installmentPlan (dev phone)', () =>
    prisma.installmentPlan.deleteMany({ where: { phone } }),
  );
  await del('facilityRequest (dev phone)', () =>
    prisma.facilityRequest.deleteMany({ where: { phone } }),
  );
  await del('membershipApplication (dev phone)', () =>
    prisma.membershipApplication.deleteMany({ where: { phone } }),
  );
  await del('member (dev phone)', () =>
    prisma.member.deleteMany({ where: { patientPhone: phone } }),
  );
  await del('reminder (dev phone)', () =>
    prisma.reminder.deleteMany({ where: { patientPhone: phone } }),
  );
  await del('booking (dev phone)', () =>
    prisma.booking.deleteMany({ where: { patientPhone: phone } }),
  );
  await del('consultation (dev phone)', () =>
    prisma.consultation.deleteMany({ where: { patientPhone: phone } }),
  );
  await del('insuranceInquiry (dev phone)', () =>
    prisma.insuranceInquiry.deleteMany({ where: { patientPhone: phone } }),
  );
  await del('doctorReview (dev phone)', () =>
    prisma.doctorReview.deleteMany({ where: { patientPhone: phone } }),
  );
  await del('complaint (dev phone)', () =>
    prisma.complaint.deleteMany({ where: { patientPhone: phone } }),
  );
  await del('partnerRequest (dev phone)', () =>
    prisma.partnerRequest.deleteMany({ where: { patientPhone: phone } }),
  );
  await del('otpChallenge (dev phone)', () =>
    prisma.otpChallenge.deleteMany({ where: { phone } }),
  );
  await del('user (dev phone)', () => prisma.user.deleteMany({ where: { phone } }));
}

async function deleteDemoTagged(report: DeleteReport, dryRun: boolean, devPhone: string) {
  const demoOrderIds = await findDemoShopOrderIds();
  const otherPhone = { not: devPhone };

  const apply = async (
    label: string,
    countFn: () => Promise<number>,
    deleteFn: () => Promise<{ count: number }>,
  ) => {
    if (dryRun) {
      bump(report, label, await countFn());
      return;
    }
    bump(report, label, (await deleteFn()).count);
  };

  await apply(
    'booking (demo doctorName, other phones)',
    () =>
      prisma.booking.count({
        where: { doctorName: 'دکتر نمونه', patientPhone: otherPhone },
      }),
    () =>
      prisma.booking.deleteMany({
        where: { doctorName: 'دکتر نمونه', patientPhone: otherPhone },
      }),
  );

  await apply(
    'consultation (demo text, other phones)',
    () =>
      prisma.consultation.count({
        where: { AND: [demoConsultationWhere(), { patientPhone: otherPhone }] },
      }),
    () =>
      prisma.consultation.deleteMany({
        where: { AND: [demoConsultationWhere(), { patientPhone: otherPhone }] },
      }),
  );

  await apply(
    'membershipApplication (seed source, other phones)',
    () =>
      prisma.membershipApplication.count({
        where: { AND: [demoMembershipAppWhere(), { phone: otherPhone }] },
      }),
    () =>
      prisma.membershipApplication.deleteMany({
        where: { AND: [demoMembershipAppWhere(), { phone: otherPhone }] },
      }),
  );

  const otherDemoOrderIds = (
    await prisma.shopOrder.findMany({
      where: { id: { in: demoOrderIds }, customerPhone: otherPhone },
      select: { id: true },
    })
  ).map((r) => r.id);

  await apply(
    'shopOrder (demo address/items, other phones)',
    () => prisma.shopOrder.count({ where: { id: { in: otherDemoOrderIds } } }),
    () =>
      otherDemoOrderIds.length
        ? prisma.shopOrder.deleteMany({ where: { id: { in: otherDemoOrderIds } } })
        : Promise.resolve({ count: 0 }),
  );

  await apply(
    'facilityRequest (demo text, other phones)',
    () =>
      prisma.facilityRequest.count({
        where: { AND: [demoFacilityWhere(), { phone: otherPhone }] },
      }),
    () =>
      prisma.facilityRequest.deleteMany({
        where: { AND: [demoFacilityWhere(), { phone: otherPhone }] },
      }),
  );

  await apply(
    'clubHistoryItem (demo reason, other phones)',
    () =>
      prisma.clubHistoryItem.count({
        where: { AND: [demoClubHistoryWhere(), { profilePhone: otherPhone }] },
      }),
    () =>
      prisma.clubHistoryItem.deleteMany({
        where: { AND: [demoClubHistoryWhere(), { profilePhone: otherPhone }] },
      }),
  );
}

async function deleteStalePaymentIntents(report: DeleteReport, dryRun: boolean) {
  const stalePendingBefore = new Date(Date.now() - STALE_PENDING_MS);

  if (dryRun) {
    bump(
      report,
      'paymentIntent (failed)',
      await prisma.paymentIntent.count({ where: { status: 'failed' } }),
    );
    bump(
      report,
      'paymentIntent (stale pending >24h)',
      await prisma.paymentIntent.count({
        where: { status: 'pending', createdAt: { lt: stalePendingBefore } },
      }),
    );
    return;
  }

  const failed = await prisma.paymentIntent.deleteMany({ where: { status: 'failed' } });
  bump(report, 'paymentIntent (failed)', failed.count);

  const stale = await prisma.paymentIntent.deleteMany({
    where: { status: 'pending', createdAt: { lt: stalePendingBefore } },
  });
  bump(report, 'paymentIntent (stale pending >24h)', stale.count);
}

function printReport(report: DeleteReport, dryRun: boolean) {
  console.log(dryRun ? '\n--- Dry-run (would delete) ---' : '\n--- Deleted ---');
  let total = 0;
  for (const [key, count] of Object.entries(report).sort(([a], [b]) => a.localeCompare(b))) {
    if (count > 0) console.log(`  ${key}: ${count}`);
    total += count;
  }
  console.log(`  TOTAL rows: ${total}`);
}

async function main() {
  const confirm = process.argv.includes('--confirm');
  const phone = normalizePhoneDigits(DEV_PHONE);
  const report: DeleteReport = {};

  const dbUrl = process.env.DATABASE_URL || '';
  const hostHint = dbUrl.replace(/\/\/([^:@]+):([^@]+)@/, '//***:***@').split('?')[0];
  console.log(`Target DB: ${hostHint || '(DATABASE_URL not set)'}`);
  console.log(`Dev phone: ${phone}`);
  console.log(confirm ? 'Mode: CONFIRM (will backup then delete)' : 'Mode: dry-run (pass --confirm to apply)');

  if (confirm) {
    console.log('\nCreating JSON backup snapshot…');
    const snapshot = await collectBackupSnapshot(phone);
    const backupFile = writeBackup(snapshot);
    console.log(`Backup written: ${backupFile}`);
  }

  // Demo-tagged on non-dev phones, then full dev patient wipe, then stale payments
  await deleteDemoTagged(report, !confirm, phone);
  await deleteDevPhoneData(phone, report, !confirm);
  await deleteStalePaymentIntents(report, !confirm);

  printReport(report, !confirm);

  if (!confirm) {
    console.log('\nNo changes made. Re-run with --confirm after backup.');
  } else {
    console.log('\nDemo cleanup complete. Admin users and catalog content untouched.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
