import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { parseShopHomeBanners } from '@/lib/content/shop-home-banners';
import { parseShopFeaturedProductIds } from '@/lib/content/shop-featured-products';
import { parseHeroSlides } from '@/lib/content/hero-slides';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

const DEFAULT_ID = 'default';

type SettingsBody = {
  dentalReservationFee?: number;
  dentalReservationNote?: string;
  laserReservationFee?: number;
  consultantCommissionPercent?: number;
  wallet?: {
    regularCap?: number;
    membershipVipCap?: number;
    shopVipCap?: number;
    graceMonths?: number;
    installmentMin?: number;
    installmentMax?: number;
  };
  shopHomeBanners?: unknown;
  shopFeaturedProductIds?: unknown;
  heroSlides?: unknown;
};

export async function GET() {
  const auth = await requireAdmin('bookings');
  if (auth.error) {
    const walletAuth = await requireAdmin('wallets');
    if (walletAuth.error) {
      const laserAuth = await requireAdmin('laserServices');
      if (laserAuth.error) {
        const shopAuth = await requireAdmin('shop');
        if (shopAuth.error) {
          const galleryAuth = await requireAdmin('gallery');
          if (galleryAuth.error) return auth.error;
        }
      }
    }
  }

  const row =
    (await prisma.siteSettings.findUnique({ where: { id: DEFAULT_ID } })) ||
    (await prisma.siteSettings.create({ data: { id: DEFAULT_ID } }));

  return NextResponse.json({
    dentalReservationFee: row.dentalReservationFee,
    dentalReservationNote: row.dentalReservationNote ?? '',
    laserReservationFee: row.laserReservationFee,
    consultantCommissionPercent: row.consultantCommissionPercent,
    wallet: {
      regularCap: row.walletRegularCap,
      membershipVipCap: row.walletMembershipVipCap,
      shopVipCap: row.walletShopVipCap,
      graceMonths: row.walletGraceMonths,
      installmentMin: row.walletInstallmentMin,
      installmentMax: row.walletInstallmentMax,
    },
    shopHomeBanners: parseShopHomeBanners(row.shopHomeBanners),
    shopFeaturedProductIds: parseShopFeaturedProductIds(row.shopFeaturedProductIds),
    heroSlides: parseHeroSlides(row.heroSlides),
  });
}

export async function PUT(request: Request) {
  const body = await parseJson<SettingsBody>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  if (
    body.dentalReservationFee != null ||
    body.laserReservationFee != null ||
    body.dentalReservationNote != null
  ) {
    const auth = await requireAdmin('bookings');
    if (auth.error) {
      const laserAuth = await requireAdmin('laserServices');
      if (laserAuth.error || body.dentalReservationFee != null || body.dentalReservationNote != null) {
        return auth.error;
      }
    }
  }
  if (body.shopHomeBanners != null || body.shopFeaturedProductIds != null) {
    const auth = await requireAdmin('shop');
    if (auth.error) return auth.error;
  }
  if (body.heroSlides != null) {
    const auth = await requireAdmin('gallery');
    if (auth.error) return auth.error;
  }
  if (body.wallet || body.consultantCommissionPercent != null) {
    const auth = await requireAdmin('wallets');
    if (auth.error) {
      const cAuth = await requireAdmin('commissions');
      if (cAuth.error && body.wallet) return auth.error;
      if (cAuth.error && body.consultantCommissionPercent != null) return cAuth.error;
    }
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
      dentalReservationNote:
        body.dentalReservationNote != null
          ? String(body.dentalReservationNote).trim()
          : current.dentalReservationNote,
      laserReservationFee:
        body.laserReservationFee != null
          ? Number(body.laserReservationFee)
          : current.laserReservationFee,
      consultantCommissionPercent:
        body.consultantCommissionPercent != null
          ? Math.min(100, Math.max(0, Math.round(Number(body.consultantCommissionPercent))))
          : current.consultantCommissionPercent,
      walletRegularCap: w.regularCap != null ? Number(w.regularCap) : current.walletRegularCap,
      walletMembershipVipCap:
        w.membershipVipCap != null ? Number(w.membershipVipCap) : current.walletMembershipVipCap,
      walletShopVipCap: w.shopVipCap != null ? Number(w.shopVipCap) : current.walletShopVipCap,
      walletGraceMonths: w.graceMonths != null ? Number(w.graceMonths) : current.walletGraceMonths,
      walletInstallmentMin:
        w.installmentMin != null ? Number(w.installmentMin) : current.walletInstallmentMin,
      walletInstallmentMax:
        w.installmentMax != null ? Number(w.installmentMax) : current.walletInstallmentMax,
      shopHomeBanners:
        body.shopHomeBanners != null
          ? (parseShopHomeBanners(body.shopHomeBanners) as Prisma.InputJsonValue)
          : (parseShopHomeBanners(current.shopHomeBanners) as Prisma.InputJsonValue),
      shopFeaturedProductIds:
        body.shopFeaturedProductIds != null
          ? (parseShopFeaturedProductIds(body.shopFeaturedProductIds) as Prisma.InputJsonValue)
          : (parseShopFeaturedProductIds(current.shopFeaturedProductIds) as Prisma.InputJsonValue),
      heroSlides:
        body.heroSlides != null
          ? (parseHeroSlides(body.heroSlides) as Prisma.InputJsonValue)
          : (parseHeroSlides(current.heroSlides) as Prisma.InputJsonValue),
    },
  });

  return NextResponse.json({
    dentalReservationFee: row.dentalReservationFee,
    dentalReservationNote: row.dentalReservationNote ?? '',
    laserReservationFee: row.laserReservationFee,
    consultantCommissionPercent: row.consultantCommissionPercent,
    wallet: {
      regularCap: row.walletRegularCap,
      membershipVipCap: row.walletMembershipVipCap,
      shopVipCap: row.walletShopVipCap,
      graceMonths: row.walletGraceMonths,
      installmentMin: row.walletInstallmentMin,
      installmentMax: row.walletInstallmentMax,
    },
    shopHomeBanners: parseShopHomeBanners(row.shopHomeBanners),
    shopFeaturedProductIds: parseShopFeaturedProductIds(row.shopFeaturedProductIds),
    heroSlides: parseHeroSlides(row.heroSlides),
  });
}
