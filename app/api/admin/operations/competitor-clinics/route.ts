import { jsonError, parseJson } from '@/lib/auth/api-utils';
import {
  createCompetitorClinic,
  listCompetitorClinics,
} from '@/lib/competitor/clinic-service';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('dental-tariffs');
  if (auth.error) return auth.error;
  const items = await listCompetitorClinics();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireAdmin('dental-tariffs');
  if (auth.error) return auth.error;
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  try {
    const row = await createCompetitorClinic(body);
    return NextResponse.json({ item: row });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ثبت ناموفق');
  }
}
