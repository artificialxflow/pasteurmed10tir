import { jsonError } from '@/lib/auth/api-utils';
import { mintConsultationVideoAccess } from '@/lib/jitsi/consultation-video';
import { findPhysicianByPhone } from '@/lib/home-visit/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

/** Physician join — moderator:true, only for own consultations */
export async function POST(_request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const physician = await findPhysicianByPhone(auth.session.phone);
  if (!physician) return jsonError('دسترسی پزشک یافت نشد.', 403);

  const { id } = await context.params;
  const row = await prisma.consultation.findUnique({ where: { id } });
  if (!row) return jsonError('مشاوره یافت نشد.', 404);
  if (String(row.doctorId || '') !== String(physician.id)) {
    return jsonError('این ویزیت متعلق به شما نیست.', 403);
  }
  if (row.status === 'cancelled') return jsonError('این مشاوره لغو شده است.');

  try {
    const token = await mintConsultationVideoAccess({
      consultationId: id,
      sub: `physician:${physician.id}`,
      displayName: physician.name || 'پزشک',
      moderator: true,
    });
    return NextResponse.json(token);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'صدور توکن ویدیو ناموفق بود.');
  }
}
