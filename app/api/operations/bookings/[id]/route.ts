import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapBooking } from '@/lib/operations/mappers';
import { assertPhoneAccess, requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.booking.findUnique({ where: { id } });
  if (!row) return jsonError('رزرو یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone)) {
    return jsonError('دسترسی ندارید.', 403);
  }

  return NextResponse.json({ booking: mapBooking(row) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const body = await parseJson<{ status?: string }>(request);
  if (body?.status !== 'cancelled') {
    return jsonError('فقط لغو نوبت پشتیبانی می‌شود.');
  }

  const { id } = await context.params;
  const row = await prisma.booking.findUnique({ where: { id } });
  if (!row) return jsonError('رزرو یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone)) {
    return jsonError('دسترسی ندارید.', 403);
  }
  if (row.status === 'cancelled') {
    return jsonError('این رزرو قبلاً لغو شده است.');
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'cancelled', depositNonRefundable: true },
  });

  return NextResponse.json({
    booking: mapBooking(updated),
    message: 'رزرو لغو شد. بیعانه پرداخت‌شده قابل استرداد نیست.',
  });
}
