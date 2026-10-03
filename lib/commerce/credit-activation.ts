/** اعتبارسنجی مبلغ فعال‌سازی کارت اعتباری — تصمیم D0 */

export function parseRequestedAmount(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  const digits = String(raw ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d.]/g, '');
  return Number(digits);
}

export function walletAvailableCredit(ceiling: number, balance: number): number {
  return Math.max(0, Math.max(0, Number(ceiling || 0)) - Math.max(0, Number(balance || 0)));
}

export function validateRequestedAmount(
  amount: number,
  ceiling: number,
  availableCredit?: number,
): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'مبلغ درخواستی باید بیشتر از صفر باشد.';
  }
  if (!Number.isInteger(amount)) {
    return 'مبلغ درخواستی باید عدد صحیح تومان باشد.';
  }
  if (!Number.isFinite(ceiling) || ceiling <= 0) {
    return 'سقف اعتبار فعال نیست. ابتدا عضویت بخرید.';
  }
  const available =
    availableCredit == null
      ? ceiling
      : Math.max(0, Math.min(ceiling, Number(availableCredit) || 0));
  if (available <= 0) {
    return 'اعتبار باقی‌مانده شما تمام شده و امکان ثبت درخواست جدید نیست.';
  }
  if (amount > available) {
    return `مبلغ درخواستی نمی‌تواند از اعتبار باقی‌مانده (${available.toLocaleString('fa-IR')} تومان) بیشتر باشد.`;
  }
  if (amount > ceiling) {
    return `مبلغ درخواستی نمی‌تواند از سقف اعتبار (${ceiling.toLocaleString('fa-IR')} تومان) بیشتر باشد.`;
  }
  return null;
}

export function validateInstallmentCount(
  count: number,
  min: number,
  max: number,
): string | null {
  if (!Number.isInteger(count) || count < min || count > max) {
    return `تعداد اقساط باید بین ${min.toLocaleString('fa-IR')} و ${max.toLocaleString('fa-IR')} باشد.`;
  }
  return null;
}
