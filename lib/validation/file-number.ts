/** شماره پرونده (file number) — وارد شده دستی توسط پرسنل، هم‌راستا با «سیستم لبخند» */

/**
 * ارقام فارسی/عربی به لاتین تبدیل و فاصله‌های اضافی حذف می‌شوند.
 * فرمت محدود نمی‌شود چون فرمت «سیستم لبخند» هنوز تأیید نشده است.
 */
export function normalizeFileNumber(raw: string | null | undefined): string {
  return String(raw || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\s+/g, ' ')
    .trim();
}
