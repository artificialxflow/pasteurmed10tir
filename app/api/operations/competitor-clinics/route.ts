import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireVisitorRoleVisitor } from '@/lib/commerce/require-visitor';
import {
  createCompetitorClinic,
  listCompetitorClinics,
} from '@/lib/competitor/clinic-service';
import { NextResponse } from 'next/server';

export async function GET() {
  const { error } = await requireVisitorRoleVisitor();
  if (error) return error;
  const items = await listCompetitorClinics();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { error } = await requireVisitorRoleVisitor();
  if (error) return error;
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  try {
    const row = await createCompetitorClinic(body);
    return NextResponse.json({ item: row });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ثبت ناموفق');
  }
}
