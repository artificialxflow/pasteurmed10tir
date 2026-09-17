import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdminAny } from '@/lib/content/require-admin';
import { createHealthEntryForPhone } from '@/lib/health-record/service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requireAdminAny(['patients', 'fieldStaff']);
  if (auth.error) return auth.error;

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const patientPhone = String(body.patientPhone || '');
  const section = String(body.section || '');
  const date = String(body.date || '').slice(0, 10);
  if (!patientPhone || !section || !date) {
    return jsonError('موبایل بیمار، بخش و تاریخ الزامی است.');
  }

  const { patientPhone: _p, section: _s, date: _d, ...rest } = body;
  try {
    const item = await createHealthEntryForPhone({
      patientPhone,
      section,
      date,
      payload: rest,
      createdByAdminId: auth.session.userId,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ثبت ناموفق', 400);
  }
}
