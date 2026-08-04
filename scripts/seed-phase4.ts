import { PrismaClient } from '@prisma/client';
import { PASTEUR_DATA } from '../lib/data';
import { computeWalletCeiling, DEFAULT_WALLET_SETTINGS } from '../lib/wallet';

const prisma = new PrismaClient();

function commerceId(): string {
  return `PST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildDueDates(count: number, start = new Date()): string[] {
  const dates: string[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < count; i += 1) {
    dates.push(cursor.toISOString());
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates;
}

async function main() {
  const devPhone = '09126723365';
  const user = await prisma.user.findUnique({ where: { phone: devPhone } });
  if (!user) {
    console.error('Dev user not found — run npm run db:seed first');
    process.exit(1);
  }

  for (const [index, plan] of PASTEUR_DATA.memberships
    .filter((m) => m.id === 'regular' || m.id === 'vip')
    .entries()) {
    await prisma.membershipPlan.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        priceNum: plan.priceNum,
        loanTermLabel: plan.loanTermLabel,
        loanLimit: plan.loanLimit,
        downPaymentPercent: plan.downPaymentPercent,
        features: [...plan.features],
        terms: plan.terms,
        highlighted: plan.highlighted,
        sortOrder: index,
      },
      update: {
        name: plan.name,
        price: plan.price,
        priceNum: plan.priceNum,
        loanTermLabel: plan.loanTermLabel,
        loanLimit: plan.loanLimit,
        downPaymentPercent: plan.downPaymentPercent,
        features: [...plan.features],
        terms: plan.terms,
        highlighted: plan.highlighted,
        sortOrder: index,
      },
    });
  }

  for (const visitor of PASTEUR_DATA.visitors) {
    await prisma.visitor.upsert({
      where: { id: visitor.id },
      create: {
        id: visitor.id,
        name: visitor.name,
        code: visitor.code.toUpperCase(),
        commissionRate: visitor.commissionRate,
        phone: visitor.phone,
        status: visitor.status as 'active' | 'inactive',
      },
      update: {
        name: visitor.name,
        code: visitor.code.toUpperCase(),
        commissionRate: visitor.commissionRate,
        phone: visitor.phone,
        status: visitor.status as 'active' | 'inactive',
      },
    });
  }

  await prisma.member.deleteMany({ where: { patientPhone: devPhone } });
  await prisma.membershipApplication.deleteMany({ where: { phone: devPhone } });
  await prisma.shopOrder.deleteMany({ where: { customerPhone: devPhone } });
  await prisma.facilityRequest.deleteMany({ where: { phone: devPhone } });
  await prisma.installmentPlan.deleteMany({ where: { phone: devPhone } });
  await prisma.commission.deleteMany({ where: { customerPhone: devPhone } });
  await prisma.walletTransaction.deleteMany({ where: { walletPhone: devPhone } });
  await prisma.wallet.deleteMany({ where: { phone: devPhone } });

  await prisma.member.create({
    data: {
      id: commerceId(),
      userId: user.id,
      planId: 'vip',
      planName: 'VIP',
      patientName: user.name,
      patientPhone: devPhone,
      amount: 1600000,
      status: 'paid',
      validityLabel: '۱ ساله',
      membershipDurationLabel: 'عضویت یک‌ساله',
      discountPercent: 0,
    },
  });

  await prisma.membershipApplication.create({
    data: {
      id: commerceId(),
      patientName: user.name,
      phone: devPhone,
      planTitle: 'VIP',
      tier: 'vip',
      tierLabel: 'VIP',
      amountToman: 1600000,
      status: 'paid',
      source: 'seed-phase4',
      referralCode: 'PLUS100',
      visitorName: 'ویزیتور شمال تبریز',
    },
  });

  const settings = (await prisma.siteSettings.findUnique({ where: { id: 'default' } })) || {
    walletRegularCap: DEFAULT_WALLET_SETTINGS.regularCap,
    walletMembershipVipCap: DEFAULT_WALLET_SETTINGS.membershipVipCap,
    walletShopVipCap: DEFAULT_WALLET_SETTINGS.shopVipCap,
    walletGraceMonths: DEFAULT_WALLET_SETTINGS.graceMonths,
    walletInstallmentMax: DEFAULT_WALLET_SETTINGS.installmentMax,
  };

  const activeKinds = ['regular', 'membership-vip', 'shop-vip'];
  const ceiling = computeWalletCeiling(activeKinds as ('regular' | 'membership-vip' | 'shop-vip')[], {
    regularCap: settings.walletRegularCap,
    membershipVipCap: settings.walletMembershipVipCap,
    shopVipCap: settings.walletShopVipCap,
    graceMonths: settings.walletGraceMonths,
    installmentMin: DEFAULT_WALLET_SETTINGS.installmentMin,
    installmentMax: settings.walletInstallmentMax,
  });

  await prisma.wallet.create({
    data: {
      phone: devPhone,
      userId: user.id,
      balance: 0,
      ceiling,
      activeKinds,
      status: 'active',
      shopVip: true,
      transactions: {
        create: {
          id: commerceId(),
          type: 'upgrade',
          amount: ceiling,
          balanceAfter: 0,
          description: `ارتقای سقف اعتبار به ${ceiling.toLocaleString('fa-IR')} تومان`,
          status: 'completed',
        },
      },
    },
  });

  const start = new Date();
  start.setMonth(start.getMonth() + (settings.walletGraceMonths || 1));
  await prisma.installmentPlan.create({
    data: {
      id: commerceId(),
      phone: devPhone,
      patientName: user.name,
      source: 'credit',
      title: `اقساط بسته اعتباری ${ceiling.toLocaleString('fa-IR')} تومان`,
      totalAmount: ceiling,
      paidAmount: 0,
      installmentCount: settings.walletInstallmentMax || 6,
      dueDates: buildDueDates(settings.walletInstallmentMax || 6, start),
      status: 'active',
    },
  });

  const visitor = await prisma.visitor.findFirst({ where: { code: 'PLUS100' } });
  if (visitor) {
    await prisma.commission.create({
      data: {
        id: commerceId(),
        visitorId: visitor.id,
        visitorName: visitor.name,
        referralCode: visitor.code,
        commissionRate: visitor.commissionRate,
        commissionAmount: Math.round((1600000 * visitor.commissionRate) / 100),
        sourceType: 'membership',
        sourceLabel: 'VIP',
        customerName: user.name,
        customerPhone: devPhone,
        amount: 1600000,
        status: 'pending',
      },
    });
  }

  await prisma.shopOrder.create({
    data: {
      id: commerceId(),
      userId: user.id,
      customerType: 'vip',
      customerTypeLabel: 'VIP تجهیزات',
      customerName: user.name,
      customerPhone: devPhone,
      address: 'تهران — نمونه seed فاز ۴',
      items: [
        {
          id: 'seed-item',
          name: 'محصول نمونه',
          category: 'پزشکی',
          qty: 1,
          unitPrice: 500000,
          finalUnitPrice: 490000,
        },
      ],
      subtotal: 500000,
      discount: 10000,
      total: 490000,
      status: 'pending',
    },
  });

  await prisma.facilityRequest.create({
    data: {
      id: commerceId(),
      name: user.name,
      phone: devPhone,
      amount: '5000000',
      amountNum: 5000000,
      description: 'درخواست تسهیلات نمونه — seed فاز ۴',
      status: 'pending',
    },
  });

  console.log('Phase 4 seed complete — membership, wallet, commission, order, facility for', devPhone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
