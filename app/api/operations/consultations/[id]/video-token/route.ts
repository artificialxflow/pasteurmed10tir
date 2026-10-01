import { jsonError } from '@/lib/auth/api-utils';
import { mintConsultationVideoAccess } from '@/lib/jitsi/consultation-video';
import { assertPhoneAccess, requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

/** Patient join — moderator:false. Requires open video session. */
export async function POST(_request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.consultation.findUnique({ where: { id } });
  if (!row) return jsonError('مشاوره یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone)) {
    return jsonError('دسترسی ندارید.', 403);
  }

  try {
    const token = await mintConsultationVideoAccess({
      consultationId: id,
      sub: auth.session.userId,
      displayName: row.patientName || auth.session.phone,
      moderator: false,
    });
    return NextResponse.json(token);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'صدور توکن ویدیو ناموفق بود.');
  }
}
