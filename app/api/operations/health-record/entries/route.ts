import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { createHealthEntry, listHealthEntries } from '@/lib/health-record/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section') || undefined;
  try {
    const result = await listHealthEntries(auth.session.userId, section || undefined);
    return NextResponse.json(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'خطا', 400);
  }
}

export async function POST(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const section = String(body.section || '');
  const date = String(body.date || '').slice(0, 10);
  if (!section || !date) return jsonError('بخش و تاریخ الزامی است.');

  const { section: _s, date: _d, ...rest } = body;
  try {
    const item = await createHealthEntry({
      userId: auth.session.userId,
      section,
      date,
      payload: rest,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ثبت ناموفق', 400);
  }
}
