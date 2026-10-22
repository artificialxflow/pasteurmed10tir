import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireVisitorRoleVisitor } from '@/lib/commerce/require-visitor';
import {
  getCompetitorClinicById,
  updateCompetitorClinic,
} from '@/lib/competitor/clinic-service';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireVisitorRoleVisitor();
  if (error) return error;
  const { id } = await context.params;
  const row = await getCompetitorClinicById(id);
  if (!row) return jsonError('مرکز یافت نشد.', 404);
  return NextResponse.json({ item: row });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireVisitorRoleVisitor();
  if (error) return error;
  const { id } = await context.params;
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  try {
    const row = await updateCompetitorClinic(id, body);
    return NextResponse.json({ item: row });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ذخیره ناموفق');
  }
}
