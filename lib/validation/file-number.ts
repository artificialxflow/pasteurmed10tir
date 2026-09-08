/** شماره پرونده — دستی توسط پرسنل، هم‌راستا با «سیستم لبخند» */

/** حداقل و حداکثر رقم — تصمیم v16: از ۱ تا ۶ رقم */
export const FILE_NUMBER_MIN_LENGTH = 1;
export const FILE_NUMBER_MAX_LENGTH = 6;

/** برای maxLength ورودی — همان سقف ۶ رقم */
export const FILE_NUMBER_LENGTH = FILE_NUMBER_MAX_LENGTH;

export const FILE_NUMBER_HINT = '۱ تا ۶ رقم، بدون تکرار. برای پاک کردن خالی بگذارید.';

export const FILE_NUMBER_INVALID_MESSAGE = 'شماره پرونده باید ۱ تا ۶ رقم باشد.';

/** ارقام فارسی/عربی به لاتین تبدیل و هر چیز غیررقمی حذف می‌شود. */
export function normalizeFileNumber(raw: string | null | undefined): string {
  return String(raw || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
}

/** ۱ تا ۶ رقم. رشته خالی معتبر نیست — برای پاک کردن شماره از `null` استفاده کنید. */
export function isValidFileNumber(raw: string | null | undefined): boolean {
  const digits = normalizeFileNumber(raw);
  return digits.length >= FILE_NUMBER_MIN_LENGTH && digits.length <= FILE_NUMBER_MAX_LENGTH;
}
