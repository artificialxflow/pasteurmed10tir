import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { createHomeVisitReview } from '@/lib/home-visit/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { NextResponse } from 'next/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = await parseJson<{ rating?: number; comment?: string }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  try {
    const item = await createHomeVisitReview({
      requestId: id,
      patientPhone: auth.session.phone,
      userId: auth.session.userId,
      rating: body.rating,
      comment: body.comment,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ثبت امتیاز ناموفق بود.');
  }
}
