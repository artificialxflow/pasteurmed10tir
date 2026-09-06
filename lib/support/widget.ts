import { ROUTES } from '@/lib/routes';

export const SUPPORT_WIDGET_TITLE = 'چه کمکی از ما برمی‌آید؟';

export type SupportWidgetVariant = 'web' | 'app';

export const SUPPORT_WIDGET_OPTIONS = [
  {
    id: 'toothache',
    emoji: '🦷',
    label: 'درد دندان دارم',
    href: { web: ROUTES.web.dentalBooking, app: ROUTES.app.dentalBooking },
  },
  {
    id: 'implant',
    emoji: '✨',
    label: 'می‌خواهم ایمپلنت یا ارتودنسی انجام دهم',
    href: { web: ROUTES.web.dentalSpecialty, app: ROUTES.app.dentalSpecialty },
  },
  {
    id: 'nursing',
    emoji: '🏠',
    label: 'خدمات پرستاری در منزل می‌خواهم',
    href: { web: ROUTES.web.nursing, app: ROUTES.app.nursing },
  },
  {
    id: 'consultation',
    emoji: '💬',
    label: 'مشاوره پزشکی می‌خواهم',
    href: { web: ROUTES.web.consultation, app: ROUTES.app.consultation },
  },
  {
    id: 'laser',
    emoji: '💆',
    label: 'خدمات پوست و زیبایی می‌خواهم',
    href: { web: ROUTES.web.laser, app: ROUTES.app.laser },
  },
  {
    id: 'shop',
    emoji: '🛒',
    label: 'تجهیزات پزشکی نیاز دارم',
    href: { web: ROUTES.web.shop, app: ROUTES.app.shop },
  },
  {
    id: 'installments',
    emoji: '💳',
    label: 'درباره هزینه و اقساط سؤال دارم',
    href: { web: ROUTES.web.installments, app: ROUTES.app.installments },
  },
] as const;

export const SUPPORT_WIDGET_OTHER_SUBJECT = 'سؤال دیگری دارم';

/** صفحات تأیید/نتیجه پرداخت — ویجت آنجا مخفی می‌شود. */
export function isPaymentPath(pathname: string): boolean {
  const path = pathname.split('?')[0] || '';
  return (
    /\/(confirm|success|failed)$/.test(path) ||
    path.endsWith('/shop-success') ||
    path.endsWith('/shop-failed')
  );
}
