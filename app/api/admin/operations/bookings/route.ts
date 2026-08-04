import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapBooking } from '@/lib/operations/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
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

export async function PATCH(request: Request) {
  const auth = await requireAdmin('bookings');
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string; status?: string }>(request);
  if (!body?.id) return jsonError('شناسه رزرو الزامی است.');

  const status = body.status === 'cancelled' ? 'cancelled' : undefined;
  if (!status) return jsonError('وضعیت نامعتبر است.');

  const row = await prisma.booking.update({
    where: { id: body.id },
    data: { status, depositNonRefundable: true },
  });

  return NextResponse.json({ booking: mapBooking(row) });
}
