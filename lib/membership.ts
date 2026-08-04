/**
 * منطق عضویت دندانپزشکی — پاستور پلاس
 */
import { PASTEUR_DATA, type Membership, type MembershipCoveragePlan } from './data';
import { PasteurStorage } from './storage';

export type MembershipTier = 'regular' | 'vip';

export function getDurationOptions(): MembershipCoveragePlan[] {
  return PASTEUR_DATA.membershipCoveragePlans.map((plan) => ({ ...plan }));
}

function defaultMembershipPlans(): Membership[] {
  return PASTEUR_DATA.memberships
    .filter((m) => m.id === 'regular' || m.id === 'vip')
    .map((m) => ({
      ...m,
      features: [...m.features],
    }));
}

export function getMembershipPlans(): Membership[] {
  // Sync fallback — prefer getMembershipPlansAsync for DB
  if (typeof window !== 'undefined') {
    PasteurStorage.initMembershipPlansIfNeeded();
    return PasteurStorage.getMembershipPlans();
  }
  return defaultMembershipPlans();
}

export async function getMembershipPlansAsync(): Promise<Membership[]> {
  try {
    const { getMembershipPlansApi } = await import('./commerce/client');
    const data = await getMembershipPlansApi();
    if (data.items?.length) return data.items.map((m) => ({ ...m, features: [...m.features] }));
  } catch {
    /* fall through */
  }
  return getMembershipPlans();
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

export function getLoanPlan(tier: MembershipTier, plans?: Membership[]): Membership {
  const source = plans || getMembershipPlans();
  return source.find((p) => p.id === tier) || source[0];
}

export function getDownPaymentPercent(tier: MembershipTier, plans?: Membership[]): number {
  const plan = getLoanPlan(tier, plans);
  return Number(plan?.downPaymentPercent ?? (tier === 'vip' ? 20 : 30));
}

export function computeDownPayment(loanAmount: number, percent: number): number {
  return Math.round(Math.max(0, loanAmount) * Math.max(0, percent) / 100);
}

export function computeFinancedAmount(loanAmount: number, downPaymentAmount: number): number {
  return Math.max(0, loanAmount - downPaymentAmount);
}

export function getLoanMonthOptions(tier: MembershipTier, plans?: Membership[]): number[] {
  const plan = getLoanPlan(tier, plans);
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
  plans,
}: {
  tier: MembershipTier;
  amount: number | string;
  months: number | string;
  plans?: Membership[];
}) {
  const plan = getLoanPlan(tier, plans);
  const limit = Number(plan?.loanLimit || 0);
  const validAmount = Math.min(Math.max(0, Number(amount || 0)), limit);
  const term = Math.max(1, Number(months || 1));
  const downPaymentPercent = getDownPaymentPercent(tier, plans);
  const downPaymentAmount = computeDownPayment(validAmount, downPaymentPercent);
  const remaining = computeFinancedAmount(validAmount, downPaymentAmount);
  const totalRepayment = Math.round(remaining * 1.12);
  const installment = Math.ceil(totalRepayment / term);
  return {
    plan,
    limit,
    validAmount,
    downPaymentPercent,
    downPaymentAmount,
    remaining,
    totalRepayment,
    installment,
    months: term,
  };
}
