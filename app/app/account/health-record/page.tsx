import { ROUTES } from '@/lib/routes';
import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

function buildHealthRecordTarget(base: string, searchParams: SearchParams): string {
  const keys = Object.keys(searchParams);
  if (!keys.length) return base;
  const q = new URLSearchParams();
  for (const key of keys) {
    const v = searchParams[key];
    if (typeof v === 'string') q.set(key, v);
    else if (Array.isArray(v)) v.forEach((item) => q.append(key, item));
  }
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

/** سازگاری با لینک‌های قدیمی UAT: /app/account/health-record → /app/health-record */
export default async function LegacyAppAccountHealthRecordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  redirect(buildHealthRecordTarget(ROUTES.app.healthRecord, params));
}
