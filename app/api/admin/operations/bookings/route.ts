import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapBooking } from '@/lib/operations/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import type { BookingStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('bookings');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const rows = await prisma.booking.findMany({
    where: type && type !== 'all' ? { type } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items: rows.map(mapBooking) });
}

type PatchBody = {
  id?: string;
  status?: string;
  day?: string;
  timeValue?: string;
  timeLabel?: string;
  doctorId?: string;
  doctorName?: string;
};

export async function PATCH(request: Request) {
  const auth = await requireAdmin('bookings');
  if (auth.error) return auth.error;

  const body = await parseJson<PatchBody>(request);
  if (!body?.id) return jsonError('شناسه رزرو الزامی است.');

  const existing = await prisma.booking.findUnique({ where: { id: body.id } });
  if (!existing) return jsonError('رزرو یافت نشد.', 404);

  const status: BookingStatus | undefined =
    body.status && ['pending', 'confirmed', 'cancelled'].includes(body.status)
      ? (body.status as BookingStatus)
      : undefined;

  const hasEdit =
    status !== undefined ||
    body.day !== undefined ||
    body.timeValue !== undefined ||
    body.timeLabel !== undefined ||
    body.doctorId !== undefined ||
    body.doctorName !== undefined;

  if (!hasEdit) return jsonError('فیلدی برای به‌روزرسانی ارسال نشده است.');

  const row = await prisma.booking.update({
    where: { id: body.id },
    data: {
      ...(status ? { status } : {}),
      ...(status === 'cancelled' ? { depositNonRefundable: true } : {}),
      ...(body.day !== undefined ? { day: body.day.trim() || null } : {}),
      ...(body.timeValue !== undefined ? { timeValue: body.timeValue.trim() || null } : {}),
      ...(body.timeLabel !== undefined ? { timeLabel: body.timeLabel.trim() || null } : {}),
      ...(body.doctorId !== undefined ? { doctorId: body.doctorId.trim() || null } : {}),
      ...(body.doctorName !== undefined ? { doctorName: body.doctorName.trim() || null } : {}),
    },
  });

  return NextResponse.json({ booking: mapBooking(row) });
}
