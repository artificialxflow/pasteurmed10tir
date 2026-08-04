import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const DEFAULT_ID = 'default';

type SettingsBody = {
  dentalReservationFee?: number;
  wallet?: {
    regularCap?: number;
    membershipVipCap?: number;
    shopVipCap?: number;
    graceMonths?: number;
    installmentMin?: number;
    installmentMax?: number;
  };
};

export async function GET() {
  const auth = await requireAdmin('bookings');
  if (auth.error) {
    const walletAuth = await requireAdmin('wallets');
    if (walletAuth.error) return auth.error;
  }

  const row =
    (await prisma.siteSettings.findUnique({ where: { id: DEFAULT_ID } })) ||
    (await prisma.siteSettings.create({ data: { id: DEFAULT_ID } }));

  return NextResponse.json({
    dentalReservationFee: row.dentalReservationFee,
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

export async function PUT(request: Request) {
  const body = await parseJson<SettingsBody>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  if (body.dentalReservationFee != null) {
    const auth = await requireAdmin('bookings');
    if (auth.error) return auth.error;
  }
  if (body.wallet) {
    const auth = await requireAdmin('wallets');
    if (auth.error) return auth.error;
  }

  const current =
    (await prisma.siteSettings.findUnique({ where: { id: DEFAULT_ID } })) ||
    (await prisma.siteSettings.create({ data: { id: DEFAULT_ID } }));

  const w = body.wallet || {};
  const row = await prisma.siteSettings.update({
    where: { id: DEFAULT_ID },
    data: {
      dentalReservationFee:
        body.dentalReservationFee != null
          ? Number(body.dentalReservationFee)
          : current.dentalReservationFee,
      walletRegularCap: w.regularCap != null ? Number(w.regularCap) : current.walletRegularCap,
      walletMembershipVipCap:
        w.membershipVipCap != null ? Number(w.membershipVipCap) : current.walletMembershipVipCap,
      walletShopVipCap: w.shopVipCap != null ? Number(w.shopVipCap) : current.walletShopVipCap,
      walletGraceMonths: w.graceMonths != null ? Number(w.graceMonths) : current.walletGraceMonths,
      walletInstallmentMin:
        w.installmentMin != null ? Number(w.installmentMin) : current.walletInstallmentMin,
      walletInstallmentMax:
        w.installmentMax != null ? Number(w.installmentMax) : current.walletInstallmentMax,
    },
  });

  return NextResponse.json({
    dentalReservationFee: row.dentalReservationFee,
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
