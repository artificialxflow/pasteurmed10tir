import { parseMembershipTier, type MembershipTier } from '@/lib/membership';

/** بررسی client-side از لیست applicationهای کاربر */
export function hasPaidMembershipInItems(
  items: Array<Record<string, unknown>>,
  tier: MembershipTier,
): boolean {
  const want = parseMembershipTier(tier);
  return items.some((a) => {
    const status = String(a.status || '').toLowerCase();
    if (status !== 'paid' && status !== 'approved') return false;
    const loan = Number(a.loanAmount || 0);
    if (loan > 0 || String(a.source || '') === 'loan-request') return false;
    const appTier = parseMembershipTier(a.tier ?? a.planId);
    if (want === 'eco-plus') return appTier === 'eco-plus';
    if (want === 'vip') return appTier === 'vip';
    return appTier === 'regular';
  });
}