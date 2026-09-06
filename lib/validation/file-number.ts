/** شماره پرونده (file number) — وارد شده دستی توسط پرسنل، هم‌راستا با «سیستم لبخند» */

/** طول ثابت شماره پرونده — تصمیم مشتری: «عددش ۵ رقمی باشه» */
export const FILE_NUMBER_LENGTH = 5;

/** ارقام فارسی/عربی به لاتین تبدیل و هر چیز غیررقمی حذف می‌شود. */
export function normalizeFileNumber(raw: string | null | undefined): string {
  return String(raw || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
}

/** دقیقاً ۵ رقم. رشته خالی معتبر نیست — برای پاک کردن شماره از `null` استفاده کنید. */
export function isValidFileNumber(raw: string | null | undefined): boolean {
  return new RegExp(`^\\d{${FILE_NUMBER_LENGTH}}$`).test(normalizeFileNumber(raw));
}
