import { PASTEUR_DATA } from "@/lib/data";

export type GroupDiscountTier = {
  minMembers: number;
  percent: number;
};

/** سقف تخفیف مجموعه روی فرم عضویت — بدون پنل سازمانی */
export const MAX_GROUP_DISCOUNT_PERCENT = 5;

/** گزینه‌های قابل انتخاب روی فرم */
export const GROUP_DISCOUNT_CHOICES = [0, 2, 3, 5] as const;

/** پلکان پیشنهادی — قابل override از membershipPricing */
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

/** پیشنهاد درصد بر اساس تعداد اعضا (سقف ۵٪) */
export function resolveGroupDiscountPercent(memberCount: number): number {
  const count = Math.max(1, Math.floor(memberCount));
  const tiers = [...getGroupDiscountTiers()].sort((a, b) => b.minMembers - a.minMembers);
  const match = tiers.find((t) => count >= t.minMembers);
  return clampGroupDiscountPercent(match?.percent ?? 0);
}

export function clampGroupDiscountPercent(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_GROUP_DISCOUNT_PERCENT, n);
}

export function applyMembershipDiscounts(input: {
  subtotal: number;
  durationDiscountPercent?: number;
  groupDiscountPercent?: number;
}): number {
  let amount = Math.max(0, input.subtotal);
  const duration = Math.min(100, Math.max(0, input.durationDiscountPercent ?? 0));
  const group = clampGroupDiscountPercent(input.groupDiscountPercent);
  amount = Math.round(amount * (1 - duration / 100));
  amount = Math.round(amount * (1 - group / 100));
  return amount;
}
