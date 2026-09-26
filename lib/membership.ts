/**
 * منطق عضویت دندانپزشکی — پاستور پلاس
 */
import { PASTEUR_DATA, type Membership, type MembershipCoveragePlan } from './data';
import { PasteurStorage } from './storage';

export type MembershipTier = 'regular' | 'vip';

export function getDurationOptions(): MembershipCoveragePlan[] {
  return PASTEUR_DATA.membershipCoveragePlans.map((plan) => ({ ...plan }));
}

/** نمایش تخفیف مدت در جدول — قیمت دوساله/سه‌ساله از قبل شامل ۲۰٪ است. */
export function membershipDurationDiscountLabel(
  plan: Pick<MembershipCoveragePlan, 'id' | 'discountPercent'>,
): string {
  if (plan.id === 'two-year' || plan.id === 'three-year') {
    return `${PASTEUR_DATA.membershipPricing.twoYearDiscountPercent.toLocaleString('fa-IR')}٪`;
  }
  if (plan.discountPercent) {
    return `${plan.discountPercent.toLocaleString('fa-IR')}٪`;
  }
  return '—';
}

export function membershipDurationDiscountForPayment(
  plan: Pick<MembershipCoveragePlan, 'id' | 'discountPercent'> | undefined,
): number {
  if (!plan || plan.id === 'two-year' || plan.id === 'three-year') return 0;
  return plan.discountPercent || 0;
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
  if (!plan) return tier === 'vip' ? '۳۶ ماهه' : '۱۸ ماهه';
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

/** Short bridge terms for small remaining balances — no interest. */
export const ZERO_INTEREST_LOAN_MONTHS = [1, 2, 3] as const;

export const STANDARD_LOAN_INTEREST_RATE = 0.12;

export const LOAN_REQUEST_TERM_OPTIONS: Array<{ months: number; interestRate: number }> = [
  { months: 1, interestRate: 0 },
  { months: 2, interestRate: 0 },
  { months: 3, interestRate: 0 },
  { months: 6, interestRate: STANDARD_LOAN_INTEREST_RATE },
  { months: 10, interestRate: STANDARD_LOAN_INTEREST_RATE },
  { months: 12, interestRate: STANDARD_LOAN_INTEREST_RATE },
  { months: 18, interestRate: STANDARD_LOAN_INTEREST_RATE },
  { months: 24, interestRate: STANDARD_LOAN_INTEREST_RATE },
  { months: 36, interestRate: STANDARD_LOAN_INTEREST_RATE },
];

export function parseMembershipTier(value: unknown): MembershipTier {
  return value === 'vip' ? 'vip' : 'regular';
}

export function getMaxLoanMonths(tier: MembershipTier, plans?: Membership[]): number {
  const plan = getLoanPlan(tier, plans);
  const parsed = Number(plan?.loanTermLabel?.replace(/[^\d]/g, '') || 0);
  if (parsed > 0) return Math.min(36, parsed);
  return tier === 'vip' ? 36 : 18;
}

export function getLoanRequestTermOptionsForTier(
  tier: MembershipTier,
  plans?: Membership[],
): Array<{ months: number; interestRate: number }> {
  const max = getMaxLoanMonths(tier, plans);
  return LOAN_REQUEST_TERM_OPTIONS.filter((option) => option.months <= max);
}

export function isAllowedLoanRequestTerm(
  months: number,
  tier: MembershipTier,
  plans?: Membership[],
): boolean {
  const raw = Number(months);
  if (!Number.isFinite(raw) || raw < 1) return false;
  const term = clampLoanMonths(raw, 12);
  if (term > getMaxLoanMonths(tier, plans)) return false;
  return LOAN_REQUEST_TERM_OPTIONS.some((option) => option.months === term);
}

export function isZeroInterestLoanTerm(months: number): boolean {
  return (ZERO_INTEREST_LOAN_MONTHS as readonly number[]).includes(Number(months));
}

export function clampLoanMonths(months: number | string | undefined, fallback = 12): number {
  const raw = Number(months);
  const value = Number.isFinite(raw) && raw > 0 ? raw : fallback;
  return Math.min(36, Math.max(1, Math.round(value)));
}

/** Total repayment: 1–3 months 0%; otherwise simple 12% per year × (months/12). */
export function computeLoanRepaymentTotal(principal: number, months: number): number {
  const amount = Math.max(0, Number(principal || 0));
  const term = clampLoanMonths(months, 12);
  if (isZeroInterestLoanTerm(term)) return Math.round(amount);
  const years = term / 12;
  return Math.round(amount * (1 + STANDARD_LOAN_INTEREST_RATE * years));
}

export function loanTermInterestLabel(months: number, interestRate?: number): string {
  const rate =
    interestRate ??
    (isZeroInterestLoanTerm(months) ? 0 : STANDARD_LOAN_INTEREST_RATE);
  const monthsLabel = Number(months).toLocaleString('fa-IR');
  if (rate <= 0) return `${monthsLabel} ماهه (سود ۰٪)`;
  const years = Number(months) / 12;
  const effective = rate * years * 100;
  return `${monthsLabel} ماهه (سود سالانه ${(rate * 100).toLocaleString('fa-IR')}٪ · جمع حدود ${effective.toLocaleString('fa-IR')}٪)`;
}

export function getLoanMonthOptions(tier: MembershipTier, plans?: Membership[]): number[] {
  const plan = getLoanPlan(tier, plans);
  const maxMonths = Number(
    plan?.loanTermLabel?.replace(/[^\d]/g, '') || (tier === 'vip' ? 36 : 18),
  );
  return Array.from({ length: maxMonths }, (_, i) => i + 1)
    .filter(
      (month) =>
        [1, 2, 3, 6, 10, 12, 15, 18, 24, maxMonths].includes(month) && month <= maxMonths,
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
  let term = clampLoanMonths(months, 12);
  term = Math.min(term, getMaxLoanMonths(tier, plans));
  const downPaymentPercent = getDownPaymentPercent(tier, plans);
  const downPaymentAmount = computeDownPayment(validAmount, downPaymentPercent);
  const remaining = computeFinancedAmount(validAmount, downPaymentAmount);
  const totalRepayment = computeLoanRepaymentTotal(remaining, term);
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

/** Gross loan → financed principal + total repayment (matches membership calculator). */
export function resolveMedicalLoanForInstallment(input: {
  loanAmount: number;
  months?: number | string | null;
  tier?: unknown;
  plans?: Membership[];
}) {
  const tier = parseMembershipTier(input.tier);
  const gross = Math.max(0, Math.round(Number(input.loanAmount || 0)));
  const maxMonths = getMaxLoanMonths(tier, input.plans);
  let months = clampLoanMonths(input.months ?? undefined, 12);
  months = Math.min(months, maxMonths);
  const calc = calculateLoan({
    tier,
    amount: gross,
    months,
    plans: input.plans,
  });
  return {
    tier,
    months: calc.months,
    grossAmount: calc.validAmount,
    downPaymentPercent: calc.downPaymentPercent,
    downPaymentAmount: calc.downPaymentAmount,
    financedPrincipal: calc.remaining,
    totalRepayment: calc.totalRepayment,
    installment: calc.installment,
  };
}
