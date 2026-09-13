import { jsonError } from '@/lib/auth/api-utils';
import { getHealthEntryForUser } from '@/lib/health-record/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { NextResponse } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const item = await getHealthEntryForUser(auth.session.userId, id);
  if (!item) return jsonError('یافت نشد.', 404);
  return NextResponse.json({ item });
}
