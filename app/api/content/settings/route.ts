import { prisma } from '@/lib/prisma';
import { parseShopHomeBanners } from '@/lib/content/shop-home-banners';
import { parseShopFeaturedProductIds } from '@/lib/content/shop-featured-products';
import { resolveHeroSlides } from '@/lib/content/hero-slides';
import { NextResponse } from 'next/server';

const DEFAULT_ID = 'default';

export async function GET() {
  const row =
    (await prisma.siteSettings.findUnique({ where: { id: DEFAULT_ID } })) ||
    (await prisma.siteSettings.create({ data: { id: DEFAULT_ID } }));
  return NextResponse.json({
    dentalReservationFee: row.dentalReservationFee,
    dentalReservationNote: row.dentalReservationNote ?? '',
    laserReservationFee: row.laserReservationFee,
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
    heroSlides: resolveHeroSlides(row.heroSlides),
  });
}
