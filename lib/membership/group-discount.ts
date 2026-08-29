import { PASTEUR_DATA } from "@/lib/data";

export type GroupDiscountTier = {
  minMembers: number;
  percent: number;
};

/** پلکان پیش‌فرض — قابل override از membershipPricing در آینده */
export const DEFAULT_GROUP_DISCOUNT_TIERS: GroupDiscountTier[] = [
  { minMembers: 10, percent: 2 },
  { minMembers: 20, percent: 3 },
  { minMembers: 40, percent: 5 },
];

export function getGroupDiscountTiers(): GroupDiscountTier[] {
  const fromData = (
    PASTEUR_DATA.membershipPricing as unknown as { groupDiscountTiers?: GroupDiscountTier[] }
  ).groupDiscountTiers;
  return fromData?.length ? [...fromData] : DEFAULT_GROUP_DISCOUNT_TIERS;
}

/** بیشترین درصد قابل اعمال بر اساس تعداد اعضا */
export function resolveGroupDiscountPercent(memberCount: number): number {
  const count = Math.max(1, Math.floor(memberCount));
  const tiers = [...getGroupDiscountTiers()].sort((a, b) => b.minMembers - a.minMembers);
  const match = tiers.find((t) => count >= t.minMembers);
  return match?.percent ?? 0;
}

export function applyMembershipDiscounts(input: {
  subtotal: number;
  durationDiscountPercent?: number;
  groupDiscountPercent?: number;
}): number {
  let amount = Math.max(0, input.subtotal);
  const duration = Math.min(100, Math.max(0, input.durationDiscountPercent ?? 0));
  const group = Math.min(100, Math.max(0, input.groupDiscountPercent ?? 0));
  amount = Math.round(amount * (1 - duration / 100));
  amount = Math.round(amount * (1 - group / 100));
  return amount;
}
