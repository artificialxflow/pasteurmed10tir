import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapConsultation } from '@/lib/operations/mappers';
import { assertPhoneAccess, requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.consultation.findUnique({ where: { id } });
  if (!row) return jsonError('مشاوره یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone)) {
    return jsonError('دسترسی ندارید.', 403);
  }

  return NextResponse.json({ item: mapConsultation(row) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const body = await parseJson<{ status?: string }>(request);
  if (body?.status !== 'cancelled') {
    return jsonError('فقط لغو مشاوره پشتیبانی می‌شود.');
  }

  const { id } = await context.params;
  const row = await prisma.consultation.findUnique({ where: { id } });
  if (!row) return jsonError('مشاوره یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone)) {
    return jsonError('دسترسی ندارید.', 403);
  }
  if (row.status === 'cancelled') {
    return jsonError('این مشاوره قبلاً لغو شده است.');
  }
  if (row.status === 'answered') {
    return jsonError('مشاوره پاسخ‌داده‌شده قابل لغو نیست.');
  }
  if (row.videoStatus === 'in_call' || row.videoStatus === 'completed') {
    return jsonError('پس از شروع یا پایان ویزیت تصویری، لغو امکان‌پذیر نیست.');
  }

  const updated = await prisma.consultation.update({
    where: { id },
    data: {
      status: 'cancelled',
      ...(row.videoStatus === 'scheduled' ? { videoStatus: 'completed' as const } : {}),
    },
  });

  return NextResponse.json({
    item: mapConsultation(updated),
    message: 'مشاوره لغو شد و برای پیگیری فالوآپ ثبت می‌شود.',
  });
}
