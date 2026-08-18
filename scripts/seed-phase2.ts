import { PASTEUR_DATA, type NursingService } from '@/lib/data';
import { localizeImageUrl } from '@/lib/content/localize-url';
import { slugifyFa } from '@/lib/content/product-slug';
import { ensurePlaceholder, syncSeedAssetsToUploadDir } from '@/lib/content/seed-assets';
import {
  DEFAULT_BASE_INSURANCES,
  DEFAULT_COMPLEMENTARY_INSURANCES,
} from '@/lib/patient';
import { DEFAULT_WALLET_SETTINGS } from '@/lib/wallet';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cache = new Map<string, string>();
  const synced = await syncSeedAssetsToUploadDir();
  await ensurePlaceholder();
  console.log(`Phase 2 seed — synced ${synced} bundled files to upload dir…`);

  await prisma.nursingItem.deleteMany();
  await prisma.nursingService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.laserService.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.physician.deleteMany();
  await prisma.baseInsurance.deleteMany();
  await prisma.complementaryInsurance.deleteMany();
  await prisma.consultationType.deleteMany();

  for (let i = 0; i < PASTEUR_DATA.services.length; i++) {
    const s = PASTEUR_DATA.services[i];
    await prisma.service.create({
      data: {
        id: s.id,
        title: s.title,
        emoji: s.emoji,
        description: s.description,
        href: s.href,
        image: await localizeImageUrl(s.image, cache),
        color: s.color,
        active: true,
        sortOrder: i,
      },
    });
  }

  for (let i = 0; i < PASTEUR_DATA.laserServices.length; i++) {
    const s = PASTEUR_DATA.laserServices[i];
    await prisma.laserService.create({
      data: {
        id: s.id,
        title: s.title,
        emoji: s.emoji,
        price: s.price,
        priceNum: s.priceNum ?? null,
        description: s.description ?? null,
        active: (s as { active?: boolean }).active !== false,
        sortOrder: i,
      },
    });
  }

  for (let si = 0; si < PASTEUR_DATA.nursingServices.length; si++) {
    const s = PASTEUR_DATA.nursingServices[si] as unknown as NursingService;
    await prisma.nursingService.create({
      data: {
        id: s.id,
        title: s.title,
        emoji: s.emoji,
        price: s.price,
        description: s.description,
        image: s.image ? await localizeImageUrl(s.image, cache) : null,
        active: (s as { active?: boolean }).active !== false,
        sortOrder: si,
        items: {
          create: s.items.map((item, ii) => ({
            id: item.id,
            title: item.title,
            priceNum: item.priceNum,
            price: item.price ?? null,
            unit: item.unit ?? null,
            active: (item as { active?: boolean }).active !== false,
            sortOrder: ii,
          })),
        },
      },
    });
  }

  for (const g of PASTEUR_DATA.galleryItems) {
    await prisma.galleryItem.create({
      data: {
        id: g.id,
        category: g.category,
        title: g.title,
        before: await localizeImageUrl(g.before, cache),
        after: await localizeImageUrl(g.after, cache),
      },
    });
  }

  const dentistry = await prisma.productCategory.create({
    data: { name: 'دندانپزشکی', slug: 'dentistry', sortOrder: 1, active: true },
  });
  const medical = await prisma.productCategory.create({
    data: { name: 'پزشکی', slug: 'medical', sortOrder: 2, active: true },
  });

  for (const p of PASTEUR_DATA.products) {
    const image = await localizeImageUrl(p.image, cache);
    const categoryId = p.category === 'پزشکی' ? medical.id : dentistry.id;
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        slug: `${slugifyFa(p.name)}-${p.id}`,
        description: '',
        category: p.category,
        categoryId,
        price: p.price,
        priceNum: p.priceNum,
        stock: p.stock,
        image,
        images: [image],
        active: true,
        sortOrder: p.id,
      },
    });
  }

  for (const p of PASTEUR_DATA.physicians) {
    await prisma.physician.create({
      data: {
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        specialtyId: p.specialtyId ?? null,
        image: await localizeImageUrl(p.image, cache),
        days: [...p.days],
        status: p.status,
      },
    });
  }

  for (const i of DEFAULT_BASE_INSURANCES) {
    await prisma.baseInsurance.create({ data: { id: i.id, name: i.name, active: i.active !== false } });
  }
  for (const i of DEFAULT_COMPLEMENTARY_INSURANCES) {
    await prisma.complementaryInsurance.create({
      data: { id: i.id, name: i.name, active: i.active !== false },
    });
  }

  for (const t of PASTEUR_DATA.consultationTypes) {
    await prisma.consultationType.create({
      data: {
        id: t.id,
        label: t.label,
        emoji: t.emoji,
        desc: t.desc,
        priceNum: t.priceNum ?? null,
        price: t.price ?? null,
      },
    });
  }

  await prisma.specialtyTariff.upsert({
    where: { id: 'default' },
    create: { id: 'default', tariffs: PASTEUR_DATA.specialtyTariffs },
    update: { tariffs: PASTEUR_DATA.specialtyTariffs },
  });

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      dentalReservationFee: PASTEUR_DATA.settings.dentalReservationFee,
      walletRegularCap: DEFAULT_WALLET_SETTINGS.regularCap,
      walletMembershipVipCap: DEFAULT_WALLET_SETTINGS.membershipVipCap,
      walletShopVipCap: DEFAULT_WALLET_SETTINGS.shopVipCap,
      walletGraceMonths: DEFAULT_WALLET_SETTINGS.graceMonths,
      walletInstallmentMin: DEFAULT_WALLET_SETTINGS.installmentMin,
      walletInstallmentMax: DEFAULT_WALLET_SETTINGS.installmentMax,
    },
    update: {
      dentalReservationFee: PASTEUR_DATA.settings.dentalReservationFee,
      walletRegularCap: DEFAULT_WALLET_SETTINGS.regularCap,
      walletMembershipVipCap: DEFAULT_WALLET_SETTINGS.membershipVipCap,
      walletShopVipCap: DEFAULT_WALLET_SETTINGS.shopVipCap,
      walletGraceMonths: DEFAULT_WALLET_SETTINGS.graceMonths,
      walletInstallmentMin: DEFAULT_WALLET_SETTINGS.installmentMin,
      walletInstallmentMax: DEFAULT_WALLET_SETTINGS.installmentMax,
    },
  });

  console.log(`Phase 2 seed complete — ${cache.size} images localized.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
