import { jsonError } from '@/lib/auth/api-utils';
import { requireAdminAny } from '@/lib/content/require-admin';
import { listHealthRecordsByPhone } from '@/lib/health-record/service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdminAny(['patients', 'fieldStaff']);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '';
  if (!phone) return jsonError('موبایل بیمار الزامی است.');

  try {
    const result = await listHealthRecordsByPhone(phone);
    if (!result.user) return jsonError('بیمار یافت نشد.', 404);
    const section = searchParams.get('section');
    const items = section
      ? result.items.filter((item) => item.section === section)
      : result.items;
    return NextResponse.json({ user: result.user, items });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'خطا', 400);
  }
}
