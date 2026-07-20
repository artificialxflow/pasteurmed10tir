/**
 * منطق عضویت دندانپزشکی — پاستور پلاس
 */
import { PASTEUR_DATA, type Membership, type MembershipCoveragePlan } from './data';

export type MembershipTier = 'regular' | 'vip';

export function getDurationOptions(): MembershipCoveragePlan[] {
  return PASTEUR_DATA.membershipCoveragePlans.map((plan) => ({ ...plan }));
}

export function getMembershipPlans(): Membership[] {
  return PASTEUR_DATA.memberships
    .filter((m) => m.id === 'regular' || m.id === 'vip')
    .map((m) => ({
      ...m,
      features: [...m.features],
    }));
}

export function normalizeMemberCount(value: string | number, fallback = 1): number {
  return Math.max(1, parseInt(String(value), 10) || fallback);
}

export function getUnitPrice(tier: MembershipTier, planId: string): number {
  const plan = getDurationOptions().find((p) => p.id === planId);
  if (!plan) return 0;
  return tier === 'vip' ? plan.vipPerPerson : plan.regularPerPerson;
}

export function getValidityLabel(tier: MembershipTier, planId: string): string {
  const plan = getDurationOptions().find((p) => p.id === planId);
  if (!plan) return tier === 'vip' ? '۲۴ ماهه' : '۱۵ ماهه';
  return tier === 'vip' ? plan.vipValidity : plan.regularValidity;
}

export function formatToman(num?: number | null): string {
  return `${Number(num || 0).toLocaleString('fa-IR')} تومان`;
}

export function formatRial(num?: number | null): string {
  return `${Number(num || 0).toLocaleString('fa-IR')} ریال`;
}

export function getLoanPlan(tier: MembershipTier): Membership {
  return getMembershipPlans().find((p) => p.id === tier) || getMembershipPlans()[0];
}

export function getLoanMonthOptions(tier: MembershipTier): number[] {
  const plan = getLoanPlan(tier);
  const maxMonths = Number(
    plan?.loanTermLabel?.replace(/[^\d]/g, '') || (tier === 'vip' ? 24 : 15),
  );
  return Array.from({ length: maxMonths }, (_, i) => i + 1)
    .filter(
      (month) =>
        [3, 6, 10, 12, 15, 18, 24, maxMonths].includes(month) && month <= maxMonths,
    )
    .filter((month, index, arr) => arr.indexOf(month) === index);
}

export function calculateLoan({
  tier,
  amount,
  months,
}: {
  tier: MembershipTier;
  amount: number | string;
  months: number | string;
}) {
  const plan = getLoanPlan(tier);
  const limit = Number(plan?.loanLimit || 0);
  const validAmount = Math.min(Math.max(0, Number(amount || 0)), limit);
  const term = Math.max(1, Number(months || 1));
  const totalRepayment = Math.round(validAmount * 1.12);
  const installment = Math.ceil(totalRepayment / term);
  return { plan, limit, validAmount, totalRepayment, installment, months: term };
}
