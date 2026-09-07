import { jsonError } from '@/lib/auth/api-utils';
import { getPatientHomeVisit } from '@/lib/home-visit/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const item = await getPatientHomeVisit(id, auth.session.phone);
  if (!item) return jsonError('درخواست یافت نشد.', 404);
  return NextResponse.json({ item });
}
