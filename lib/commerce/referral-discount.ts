/** تخفیف کد معرف — تصمیم K0 */

export const REFERRAL_DISCOUNT_PERCENT = 5;

export const REFERRAL_DISCOUNT_HINT =
  'با وارد کردن کد معرف معتبر، ۵٪ تخفیف روی مبلغ همین پرداخت اعمال می‌شود.';

export const REFERRAL_CODE_NOT_FOUND = 'کد معرف یافت نشد';

export function applyReferralDiscount(amount: number): {
  payable: number;
  discountAmount: number;
  discountPercent: number;
} {
  const base = Math.max(0, Math.floor(Number(amount) || 0));
  const discountAmount = Math.floor((base * REFERRAL_DISCOUNT_PERCENT) / 100);
  return {
    payable: Math.max(0, base - discountAmount),
    discountAmount,
    discountPercent: REFERRAL_DISCOUNT_PERCENT,
  };
}

export function withReferralDiscount(
  amount: number,
  valid: boolean,
): {
  payable: number;
  referralDiscountPercent?: number;
  referralDiscountAmount?: number;
} {
  if (!valid) return { payable: Math.max(0, Math.floor(Number(amount) || 0)) };
  const { payable, discountAmount, discountPercent } = applyReferralDiscount(amount);
  return {
    payable,
    referralDiscountPercent: discountPercent,
    referralDiscountAmount: discountAmount,
  };
}
