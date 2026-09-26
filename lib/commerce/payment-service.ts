import { createCommission } from '@/lib/commerce/commission-service';
import {
  createOrgMembershipInstallmentPlan,
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
import { clampGroupDiscountPercent } from '@/lib/membership/group-discount';
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
  organizationId?: string;
  orgMemberIds?: string[];
  membershipTotalAmount?: number;
  membershipInstallmentCount?: number;
  zibalTrackId?: string | null;
}) {
  const phone = normalizePhoneDigits(input.patientPhone || '');
  if (!phone) throw new Error('شماره موبایل الزامی است.');

  const installmentCount = Math.min(
    3,
    Math.max(1, Math.round(Number(input.membershipInstallmentCount || 1))),
  );
  const isOrgInstallment =
    Boolean(input.organizationId) && installmentCount > 1 && (input.orgMemberIds?.length ?? 0) > 0;
  const totalMembershipAmount = isOrgInstallment
    ? Math.round(Number(input.membershipTotalAmount || 0))
    : Math.round(Number(input.amount || 0));
  const recordedAmount = isOrgInstallment ? totalMembershipAmount : Number(input.amount || 0);

  const user = await prisma.user.findUnique({ where: { phone } });
  const member = await prisma.member.create({
    data: {
      id: generateCommerceId(),
      userId: user?.id,
      planId: input.planId || null,
      planName: input.planName || null,
      patientName: input.patientName || null,
      patientPhone: phone,
      amount: recordedAmount,
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
      amountToman: recordedAmount || null,
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
            : clampGroupDiscountPercent(input.groupDiscountPercent),
        organizationId: input.organizationId || undefined,
        orgMemberIds: Array.isArray(input.orgMemberIds) ? input.orgMemberIds : undefined,
        membershipInstallmentCount: isOrgInstallment ? installmentCount : undefined,
        membershipTotalAmount: isOrgInstallment ? totalMembershipAmount : undefined,
      },
      status: 'paid',
      source: 'payment-complete',
    },
  });

  const wallet = await upgradeWalletForUser(
    phone,
    planIdToWalletKinds(String(input.planId || 'regular')),
  );

  // سقف اعتبار با عضویت داده می‌شود؛ طرح اقساط اعتباری دیگر خودکار ساخته نمی‌شود.
  // بیمار باید درخواست فعال‌سازی بدهد و ادمین تأیید کند (بخش D).
  if (wallet && wallet.ceiling > 0) {
    await hideMembershipInstallmentPlans(phone);
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

  const memberIds = (input.orgMemberIds || []).map(String).filter(Boolean);
  if (memberIds.length && user) {
    const org = await prisma.organization.findUnique({
      where: { representativeUserId: user.id },
      select: { id: true, name: true },
    });
    if (org) {
      const perHead = Math.round(recordedAmount / memberIds.length);
      await prisma.organizationMember.updateMany({
        where: { id: { in: memberIds }, organizationId: org.id },
        data: {
          membershipPaid: true,
          membershipAmount: perHead,
          lastPaidAt: new Date(),
        },
      });

      if (isOrgInstallment && installmentCount >= 2 && installmentCount <= 3) {
        await createOrgMembershipInstallmentPlan({
          phone,
          patientName: input.patientName,
          organizationId: org.id,
          organizationName: org.name,
          totalAmount: totalMembershipAmount,
          installmentCount: installmentCount as 2 | 3,
          firstPaymentAmount: Math.round(Number(input.amount || 0)),
          trackId: input.zibalTrackId || null,
        });
      }
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
