import { PASTEUR_DATA } from "@/lib/data";

export type GroupDiscountTier = {
  minMembers: number;
  percent: number;
};

/** سقف تخفیف مجموعه روی فرم عضویت — بدون پنل سازمانی */
export const MAX_GROUP_DISCOUNT_PERCENT = 50;

/** گزینه‌های قابل انتخاب روی فرم (۵ مورد) */
export const GROUP_DISCOUNT_CHOICES = [0, 10, 20, 30, 50] as const;

/** پلکان پیشنهادی — قابل override از membershipPricing */
export const DEFAULT_GROUP_DISCOUNT_TIERS: GroupDiscountTier[] = [
  { minMembers: 10, percent: 10 },
  { minMembers: 20, percent: 20 },
  { minMembers: 30, percent: 30 },
  { minMembers: 40, percent: 50 },
];

export function getGroupDiscountTiers(): GroupDiscountTier[] {
  const fromData = (
    PASTEUR_DATA.membershipPricing as unknown as { groupDiscountTiers?: GroupDiscountTier[] }
  ).groupDiscountTiers;
  return fromData?.length ? [...fromData] : DEFAULT_GROUP_DISCOUNT_TIERS;
}

/** پیشنهاد درصد بر اساس تعداد اعضا (سقف ۵۰٪) */
export function resolveGroupDiscountPercent(memberCount: number): number {
  const count = Math.max(1, Math.floor(memberCount));
  const tiers = [...getGroupDiscountTiers()].sort((a, b) => b.minMembers - a.minMembers);
  const match = tiers.find((t) => count >= t.minMembers);
  return clampGroupDiscountPercent(match?.percent ?? 0);
}

export function clampGroupDiscountPercent(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (!(GROUP_DISCOUNT_CHOICES as readonly number[]).includes(n)) {
    const allowed = [...GROUP_DISCOUNT_CHOICES].filter((p) => p > 0);
    const nearest = allowed.reduce((best, p) =>
      Math.abs(p - n) < Math.abs(best - n) ? p : best,
    );
    return Math.min(MAX_GROUP_DISCOUNT_PERCENT, nearest);
  }
  return Math.min(MAX_GROUP_DISCOUNT_PERCENT, n);
}

/** سقف تخفیف قرارداد سازمانی که ادمین روی هر شرکت می‌گذارد */
export const MAX_CONTRACT_DISCOUNT_PERCENT = 50;

export function clampContractDiscountPercent(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_CONTRACT_DISCOUNT_PERCENT, n);
}

export function applyMembershipDiscounts(input: {
  subtotal: number;
  durationDiscountPercent?: number;
  groupDiscountPercent?: number;
  /** اگر باشد، به‌جای سقف فرم عمومی از تخفیف قرارداد استفاده می‌شود */
  contractDiscountPercent?: number;
}): number {
  let amount = Math.max(0, input.subtotal);
  const duration = Math.min(100, Math.max(0, input.durationDiscountPercent ?? 0));
  const group =
    input.contractDiscountPercent != null
      ? clampContractDiscountPercent(input.contractDiscountPercent)
      : clampGroupDiscountPercent(input.groupDiscountPercent);
  amount = Math.round(amount * (1 - duration / 100));
  amount = Math.round(amount * (1 - group / 100));
  return amount;
}
