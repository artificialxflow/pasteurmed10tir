/**
 * Production wipe — remove ALL demo/seed/transactional data.
 *
 * Keeps:
 *   - AdminUser with username `admin` only (ops/content/finance removed)
 *   - All AdminRole rows (role definitions, not fake patient data)
 *
 * Does NOT re-seed. Enter real content via admin panels afterward.
 * Does NOT delete files under public/uploads — clean disk separately if needed.
 *
 * Usage:
 *   npx tsx scripts/wipe-for-production.ts              # abort (safety)
 *   npx tsx scripts/wipe-for-production.ts --confirm    # apply
 *
 * ALWAYS backup DATABASE_URL before --confirm on production.
 */
import { PrismaClient } from '@prisma/client';
import { resetSiteSettingsDefaults, wipeAppData } from './lib/wipe-app-data';

const prisma = new PrismaClient();

function dbHostHint(): string {
  const dbUrl = process.env.DATABASE_URL || '';
  return dbUrl.replace(/\/\/([^:@]+):([^@]+)@/, '//***:***@').split('?')[0] || '(DATABASE_URL not set)';
}

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error(
      'Refusing to run. Pass --confirm to wipe all app data and keep only admin user.\n' +
        'Example: npx tsx scripts/wipe-for-production.ts --confirm\n' +
        'Backup the database first.',
    );
    process.exit(1);
  }

  console.log(`Target DB: ${dbHostHint()}`);
  console.log('Wiping all application data (production clean slate)…');

  await wipeAppData(prisma);
  await resetSiteSettingsDefaults(prisma);

  const removedAdmins = await prisma.adminUser.deleteMany({
    where: { username: { not: 'admin' } },
  });

  const adminCount = await prisma.adminUser.count();
  const roleCount = await prisma.adminRole.count();

  if (adminCount === 0) {
    console.warn(
      'WARNING: No admin user left. Recreate with: npm run db:seed\n' +
        '(That also creates dev patient — delete patient from /admin/patients or DB.)',
    );
  }

  console.log('\nProduction wipe complete.');
  console.log(`  AdminUser kept: ${adminCount} (removed ${removedAdmins.count} other admin accounts)`);
  console.log(`  AdminRole kept: ${roleCount}`);
  console.log('\nNext steps:');
  console.log('  1. Do NOT run db:seed:phase2–phase5 (would restore fake content).');
  console.log('  2. Enter real data via /admin (services, doctors, shop, …).');
  console.log('  3. Optionally clear seed images on disk: public/uploads');
  console.log('  4. Remove DEV_OTP_* from production env before go-live.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
