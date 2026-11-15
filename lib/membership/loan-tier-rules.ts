import type { Membership } from '@/lib/data';
import {
  getLoanPlan,
  getMaxLoanMonths,
  parseMembershipTier,
  type MembershipTier,
} from '@/lib/membership';

export function regularLoanCap(plans?: Membership[]): number {
  const plan = getLoanPlan('regular', plans);
  return Number(plan?.loanLimit || 303_000_000);
}

/** کارفرما 35/06: سقف و مدت عادی → هر دو tier؛ بالاتر → فقط VIP */
export function resolveAllowedTiersForLoan(input: {
  amount: number;
  months: number;
  plans?: Membership[];
}): MembershipTier[] {
  const amount = Math.max(0, Math.round(Number(input.amount || 0)));
  const months = Math.max(1, Math.round(Number(input.months || 0)));
  const cap = regularLoanCap(input.plans);
  const regularMaxMonths = getMaxLoanMonths('regular', input.plans);
  if (amount > cap || months > regularMaxMonths) return ['vip'];
  return ['regular', 'vip', 'eco-plus'];
}

export function isTierAllowedForLoan(
  tier: unknown,
  amount: number,
  months: number,
  plans?: Membership[],
): boolean {
  const parsed = parseMembershipTier(tier);
  return resolveAllowedTiersForLoan({ amount, months, plans }).includes(parsed);
}