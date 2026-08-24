/** Absolute public URL for printable QR codes (prefer production). */
export function getQrSiteOrigin(): string {
  const fromEnv = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv;
  }
  return 'https://pasteur.plus';
}

/** Build absolute URL from a site path or full URL. */
export function toAbsolutePublicUrl(hrefOrPath: string, origin = getQrSiteOrigin()): string {
  const raw = String(hrefOrPath || '').trim();
  if (!raw) return origin;
  if (/^https?:\/\//i.test(raw)) return raw;
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${origin}${path}`;
}

export const QR_PRESET_PATHS: { path: string; label: string }[] = [
  { path: '/', label: 'صفحه اصلی' },
  { path: '/app', label: 'نسخه موبایل' },
  { path: '/dental', label: 'دندانپزشکی' },
  { path: '/dental/general', label: 'دندانپزشکان' },
  { path: '/laser', label: 'لیزر و زیبایی' },
  { path: '/nursing', label: 'پرستاری' },
  { path: '/medical', label: 'ویزیت پزشکی' },
  { path: '/shop', label: 'فروشگاه' },
];
