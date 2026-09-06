/**
 * طبقه‌بندی خطاهای زحل و تبدیل کدهای ماشینی به پیام فارسی.
 *
 * زحل رشته‌های خام انگلیسی مثل `SERVICE_DISABLED` برمی‌گرداند که مستقیم به
 * پرسنل نمایش داده می‌شد. اینجا به پیامی تبدیل می‌شود که بگوید چه کاری باید کرد.
 *
 * این فایل عمداً هیچ import ای ندارد تا هم کلاینت زحل و هم لایه گزارش
 * بتوانند بدون وابستگی حلقوی از آن استفاده کنند.
 */

export type ZohalErrorKind =
  /** سرویس روی حساب زحل خریداری/فعال نشده — با پشتیبانی زحل حل می‌شود، نه با کد */
  | 'service_disabled'
  /** مسیر endpoint پیدا نشد — احتمالاً آدرس سرویس عوض شده */
  | 'not_found'
  /** توکن نامعتبر یا بدون دسترسی */
  | 'unauthorized'
  /** سقف تعداد درخواست پر شده — موقتی */
  | 'rate_limit'
  /** قطعی شبکه یا خطای ناشناخته */
  | 'other';

export function classifyZohalError(raw: unknown): ZohalErrorKind {
  const text = String(raw || '').toLowerCase();
  if (!text) return 'other';

  if (
    text.includes('service_disabled') ||
    text.includes('service disabled') ||
    text.includes('سرویس غیرفعال') ||
    text.includes('not_purchased') ||
    text.includes('not purchased')
  ) {
    return 'service_disabled';
  }

  if (
    text.includes('404') ||
    text.includes('not found') ||
    text.includes('یافت نشد') ||
    text.includes('وجود ندارد')
  ) {
    return 'not_found';
  }

  if (
    text.includes('401') ||
    text.includes('403') ||
    text.includes('unauthorized') ||
    text.includes('forbidden') ||
    text.includes('invalid token') ||
    text.includes('توکن')
  ) {
    return 'unauthorized';
  }

  if (text.includes('429') || text.includes('rate limit') || text.includes('too many')) {
    return 'rate_limit';
  }

  return 'other';
}

/** آیا این خطا با تلاش مجدد روی مسیر دیگر ممکن است حل شود؟ */
export function isRetryablePathError(raw: unknown): boolean {
  const kind = classifyZohalError(raw);
  if (kind === 'not_found') return true;
  const text = String(raw || '').toLowerCase();
  return (
    text.includes('unknown') || text.includes('invalid method') || text.includes('method not')
  );
}

/** آیا سرویس روی حساب زحل غیرفعال است؟ (نیازمند اقدام خارج از کد) */
export function isZohalServiceDisabled(raw: unknown): boolean {
  return classifyZohalError(raw) === 'service_disabled';
}

/** جمله کامل — برای پیام بالای صفحه که پیشوند ندارد. */
const KIND_SENTENCE: Record<Exclude<ZohalErrorKind, 'other'>, string> = {
  service_disabled: 'سرویس اعتبارسنجی در پنل زحل فعال نیست — با پشتیبانی زحل تماس بگیرید.',
  not_found: 'سرویس اعتبارسنجی در دسترس نیست (مسیر یافت نشد).',
  unauthorized: 'توکن زحل معتبر نیست یا به این سرویس دسترسی ندارد.',
  rate_limit: 'تعداد درخواست بیش از حد مجاز — چند دقیقه بعد دوباره تلاش کنید.',
};

/** تکه کوتاه — بعد از پیشوندی مثل «اعتبار: » می‌آید، پس نام سرویس را تکرار نمی‌کند. */
const KIND_DETAIL: Record<Exclude<ZohalErrorKind, 'other'>, string> = {
  service_disabled: 'در پنل زحل فعال نیست — با پشتیبانی زحل تماس بگیرید',
  not_found: 'در دسترس نیست (مسیر یافت نشد)',
  unauthorized: 'توکن زحل دسترسی ندارد',
  rate_limit: 'تعداد درخواست بیش از حد مجاز',
};

function truncate(value: unknown, max: number): string {
  const text = String(value || 'خطای نامشخص')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/** جمله مستقل برای نمایش در پیام صفحه. */
export function humanizeZohalError(raw: unknown, maxUnknown = 48): string {
  const kind = classifyZohalError(raw);
  if (kind === 'other') return truncate(raw, maxUnknown);
  return KIND_SENTENCE[kind];
}

/**
 * توضیح کوتاه برای ستون خلاصه جدول. خطاهای شناخته‌شده متن کامل می‌گیرند و
 * بریده نمی‌شوند؛ فقط خطاهای ناشناخته برای جا شدن در جدول کوتاه می‌شوند.
 */
export function zohalErrorDetail(raw: unknown, maxUnknown = 48): string {
  const kind = classifyZohalError(raw);
  if (kind === 'other') return truncate(raw, maxUnknown);
  return KIND_DETAIL[kind];
}
