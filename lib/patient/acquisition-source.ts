/** نحوه آشنایی با کلینیک — ثبت‌نام پنل کاربری (اشخاص) */

export const ACQUISITION_SOURCES = [
  'social_media',
  'google',
  'outdoor_ads',
  'previous_visitors',
  'acquaintances',
] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];

export const ACQUISITION_SOURCE_LABELS: Record<AcquisitionSource, string> = {
  social_media: 'شبکه‌های اجتماعی',
  google: 'گوگل',
  outdoor_ads: 'تبلیغات محیطی',
  previous_visitors: 'مراجعین قبلی کلینیک',
  acquaintances: 'از طریق آشنایان',
};

export function isAcquisitionSource(value: string): value is AcquisitionSource {
  return (ACQUISITION_SOURCES as readonly string[]).includes(value);
}

export function parseAcquisitionSource(raw: unknown): AcquisitionSource | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  return isAcquisitionSource(v) ? v : null;
}

export function acquisitionSourceLabel(
  source: AcquisitionSource | null | undefined,
): string {
  if (!source) return '—';
  return ACQUISITION_SOURCE_LABELS[source] ?? source;
}
