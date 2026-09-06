/** اعتبارسنجی مبلغ فعال‌سازی کارت اعتباری — تصمیم D0 */

export function parseRequestedAmount(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  const digits = String(raw ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d.]/g, '');
  return Number(digits);
}

export function validateRequestedAmount(amount: number, ceiling: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'مبلغ درخواستی باید بیشتر از صفر باشد.';
  }
  if (!Number.isInteger(amount)) {
    return 'مبلغ درخواستی باید عدد صحیح تومان باشد.';
  }
  if (!Number.isFinite(ceiling) || ceiling <= 0) {
    return 'سقف اعتبار فعال نیست. ابتدا عضویت بخرید.';
  }
  if (amount > ceiling) {
    return `مبلغ درخواستی نمی‌تواند از سقف اعتبار (${ceiling.toLocaleString('fa-IR')} تومان) بیشتر باشد.`;
  }
  return null;
}
