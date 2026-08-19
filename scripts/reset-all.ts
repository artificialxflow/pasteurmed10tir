/**
 * DANGER — Dev/staging only.
 *
 * Truncates application data while KEEPING all AdminRole + AdminUser rows.
 * Does NOT touch env files. Never run against public production without explicit approval.
 *
 * For production (keep only `admin` user): use wipe-for-production.ts instead.
 *
 * Usage:
 *   npx tsx scripts/reset-all.ts
 *   npx tsx scripts/reset-all.ts --confirm
 *
 * Without --confirm the script aborts (safety).
 */
import { PrismaClient } from '@prisma/client';
import { resetSiteSettingsDefaults, wipeAppData } from './lib/wipe-app-data';

const prisma = new PrismaClient();

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error(
      'Refusing to run. Pass --confirm to truncate data (AdminRole/AdminUser kept).\n' +
        'Example: npx tsx scripts/reset-all.ts --confirm\n' +
        'Production (admin only): npx tsx scripts/wipe-for-production.ts --confirm',
    );
    process.exit(1);
  }

  console.log('Resetting application data (all admin accounts preserved)...');

  await wipeAppData(prisma);
  await resetSiteSettingsDefaults(prisma);

  const adminCount = await prisma.adminUser.count();
  const roleCount = await prisma.adminRole.count();
  console.log(`Done. AdminUser=${adminCount}, AdminRole=${roleCount} retained.`);
  console.log('Re-seed content (dev only): npm run db:seed:phase2 && …');
  console.log('Production clean slate: npx tsx scripts/wipe-for-production.ts --confirm');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
