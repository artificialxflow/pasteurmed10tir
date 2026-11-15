import { parseMembershipTier, type MembershipTier } from '@/lib/membership';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';

const PAID_STATUSES = ['paid', 'approved'] as const;

/** حق عضویت پرداخت‌شده برای همان tier (بدون درخواست وام روی همان رکورد) */
export async function hasPaidMembershipForLoanTier(
  phone: string,
  tier: MembershipTier,
): Promise<boolean> {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return false;

  const app = await prisma.membershipApplication.findFirst({
    where: {
      phone: digits,
      status: { in: [...PAID_STATUSES] },
      tier:
        tier === 'vip'
          ? 'vip'
          : tier === 'eco-plus'
            ? 'eco-plus'
            : { in: ['regular', tier] },
      OR: [{ loanAmount: null }, { loanAmount: 0 }],
      NOT: { source: 'loan-request' },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (app) return true;

  const member = await prisma.member.findFirst({
    where: {
      patientPhone: digits,
      status: 'paid',
      planId:
        tier === 'vip'
          ? 'vip'
          : tier === 'eco-plus'
            ? 'eco-plus'
            : { in: ['regular', tier] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return Boolean(member);
}

export async function requirePaidMembershipForLoan(
  phone: string,
  tierRaw: unknown,
): Promise<{ ok: true; tier: MembershipTier } | { ok: false; message: string }> {
  const tier = parseMembershipTier(tierRaw);
  const paid = await hasPaidMembershipForLoanTier(phone, tier);
  if (!paid) {
    return {
      ok: false,
      message:
        'پیش از ثبت درخواست وام، حق عضویت طرح انتخابی را در همین پنل پرداخت کنید.',
    };
  }
  return { ok: true, tier };
}