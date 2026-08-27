import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const DEFAULT_ID = 'default';

export async function GET() {
  const row =
    (await prisma.siteSettings.findUnique({ where: { id: DEFAULT_ID } })) ||
    (await prisma.siteSettings.create({ data: { id: DEFAULT_ID } }));
  return NextResponse.json({
    dentalReservationFee: row.dentalReservationFee,
    laserReservationFee: row.laserReservationFee,
    wallet: {
      regularCap: row.walletRegularCap,
      membershipVipCap: row.walletMembershipVipCap,
      shopVipCap: row.walletShopVipCap,
      graceMonths: row.walletGraceMonths,
      installmentMin: row.walletInstallmentMin,
      installmentMax: row.walletInstallmentMax,
    },
  });
}
