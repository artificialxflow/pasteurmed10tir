import { jsonError } from '@/lib/auth/api-utils';
import { requireAdminAny } from '@/lib/content/require-admin';
import {
  listHealthRecordsByPhone,
  listHealthRecordsByUserId,
  searchHealthRecordPatients,
} from '@/lib/health-record/service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdminAny(['patients', 'fieldStaff']);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const userId = (searchParams.get('userId') || '').trim();
  const phone = (searchParams.get('phone') || '').trim();
  const section = searchParams.get('section');

  try {
    if (q && !userId) {
      const matches = await searchHealthRecordPatients(q);
      return NextResponse.json({ matches });
    }

    const result = userId
      ? await listHealthRecordsByUserId(userId)
      : phone
        ? await listHealthRecordsByPhone(phone)
        : null;
    if (!result) return jsonError('جستجو (نام یا موبایل) یا انتخاب بیمار الزامی است.');
    if (!result.user) return jsonError('بیمار یافت نشد.', 404);
    const items = section
      ? result.items.filter((item) => item.section === section)
      : result.items;
    return NextResponse.json({ user: result.user, items, matches: [] });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'خطا', 400);
  }
}
