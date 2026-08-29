import { createCommission } from '@/lib/commerce/commission-service';
import {
  createCreditInstallmentPlan,
  hideMembershipInstallmentPlans,
} from '@/lib/commerce/installment-service';
import { generateCommerceId, mapMember, mapMembershipApplication } from '@/lib/commerce/mappers';
import {
  activateShopVip,
  getOrCreateWallet,
  upgradeWalletForUser,
} from '@/lib/commerce/wallet-service';
import { addClubPoints } from '@/lib/club/service';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { planIdToWalletKinds } from '@/lib/wallet';
import { prisma } from '@/lib/prisma';

export async function completeShopVipPayment(input: {
  patientName?: string;
  patientPhone?: string;
  planName?: string;
  amount?: number;
  referralCode?: string;
}) {
  const phone = normalizePhoneDigits(input.patientPhone || '');
  if (!phone) throw new Error('شماره موبایل الزامی است.');

  const user = await prisma.user.findUnique({ where: { phone } });
  await activateShopVip(phone);

  const application = await prisma.membershipApplication.create({
    data: {
      id: generateCommerceId(),
      patientName: input.patientName || null,
      phone,
      planTitle: input.planName || 'VIP تجهیزات',
      tier: 'shop-vip',
      tierLabel: 'VIP تجهیزات',
      amountToman: Number(input.amount || 0) || null,
      referralCode: input.referralCode || null,
      status: 'paid',
      source: 'shop-vip-payment',
    },
  });

  let commission = null;
  if (input.referralCode) {
    commission = await createCommission({
      referralCode: input.referralCode,
      sourceType: 'shop-vip',
      sourceLabel: input.planName,
      customerName: input.patientName,
      customerPhone: phone,
      amount: input.amount,
    });
  }

  return {
    application: mapMembershipApplication(application),
    commission,
    userId: user?.id,
  };
}

export async function completeMembershipPayment(input: {
  patientName?: string;
  patientPhone?: string;
  planId?: string;
  planName?: string;
  amount?: number;
  validityLabel?: string;
  membershipDurationLabel?: string;
  discountPercent?: number;
  groupDiscountPercent?: number;
  referralCode?: string;
}) {
  const phone = normalizePhoneDigits(input.patientPhone || '');
  if (!phone) throw new Error('شماره موبایل الزامی است.');

  const user = await prisma.user.findUnique({ where: { phone } });
  const member = await prisma.member.create({
    data: {
      id: generateCommerceId(),
      userId: user?.id,
      planId: input.planId || null,
      planName: input.planName || null,
      patientName: input.patientName || null,
      patientPhone: phone,
      amount: Number(input.amount || 0),
      validityLabel: input.validityLabel || null,
      membershipDurationLabel: input.membershipDurationLabel || null,
      discountPercent:
        input.discountPercent === undefined || input.discountPercent === null
          ? null
          : Number(input.discountPercent),
      status: 'paid',
    },
  });

  const application = await prisma.membershipApplication.create({
    data: {
      id: generateCommerceId(),
      patientName: input.patientName || null,
      phone,
      planTitle: input.planName || null,
      tier: input.planId || null,
      tierLabel: input.planId === 'vip' ? 'VIP' : input.planId || null,
      amountToman: Number(input.amount || 0) || null,
      referralCode: input.referralCode || null,
      validityLabel: input.validityLabel || null,
      membershipDurationLabel: input.membershipDurationLabel || null,
      discountPercent:
        input.discountPercent === undefined || input.discountPercent === null
          ? null
          : Number(input.discountPercent),
      extra: {
        groupDiscountPercent:
          input.groupDiscountPercent === undefined || input.groupDiscountPercent === null
            ? undefined
            : Number(input.groupDiscountPercent),
      },
      status: 'paid',
      source: 'payment-complete',
    },
  });

  const wallet = await upgradeWalletForUser(
    phone,
    planIdToWalletKinds(String(input.planId || 'regular')),
  );

  if (wallet && wallet.ceiling > 0) {
    await hideMembershipInstallmentPlans(phone);
    const existingCredit = await prisma.installmentPlan.findFirst({
      where: {
        phone,
        source: { in: ['credit', 'wallet'] },
        status: { not: 'hidden' },
      },
    });
    if (!existingCredit) {
      await createCreditInstallmentPlan({
        phone,
        patientName: input.patientName,
        ceilingAmount: wallet.ceiling,
        label: `اقساط بسته اعتباری ${wallet.ceiling.toLocaleString('fa-IR')} تومان`,
      });
    }
  }

  let commission = null;
  if (input.referralCode) {
    commission = await createCommission({
      referralCode: input.referralCode,
      sourceType: input.planId === 'shop-vip' ? 'shop-vip' : 'membership',
      sourceLabel: input.planName,
      customerName: input.patientName,
      customerPhone: phone,
      amount: input.amount,
    });
  }

  const planId = String(input.planId || 'regular');
  if (planId === 'regular' || planId === 'vip') {
    const alreadyAwarded = await prisma.clubHistoryItem.findFirst({
      where: {
        profilePhone: phone,
        reason: { startsWith: 'عضویت طرح' },
      },
    });
    if (!alreadyAwarded) {
      await addClubPoints(phone, 100, `عضویت طرح ${input.planName || planId}`);
    }
  }

  return {
    member: mapMember(member),
    application: mapMembershipApplication(application),
    commission,
  };
}

export async function ensureWalletForMemberPhone(phone: string) {
  return getOrCreateWallet(phone);
}
