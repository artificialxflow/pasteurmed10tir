import { isoToJalali } from '@/lib/date/jalali';

/** تاریخ شمسی با ارقام لاتین برای نام فایل، مثلاً `1404-08-16` */
export function jalaliFilenameStamp(value: Date | string = new Date()): string {
  const iso = value instanceof Date ? value.toISOString() : String(value).trim();
  const parts = isoToJalali(iso);
  if (!parts) return 'date-unknown';
  return `${parts.jy}-${String(parts.jm).padStart(2, '0')}-${String(parts.jd).padStart(2, '0')}`;
}

export function adminExportFilename(basename: string, ext: string, at?: Date): string {
  return `${basename}-${jalaliFilenameStamp(at)}.${ext}`;
}
