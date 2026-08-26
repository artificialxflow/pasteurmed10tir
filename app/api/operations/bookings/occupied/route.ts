import { jsonError } from '@/lib/auth/api-utils';
import { iranDayBounds } from '@/lib/operations/booking-dates';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctorId');
  const day = searchParams.get('day');
  const date = searchParams.get('date');
  const type = searchParams.get('type');

  if (!doctorId || !type) {
    return jsonError('پارامترهای occupied ناقص است.');
  }

  if (!date && !day) {
    return jsonError('تاریخ یا روز حضور الزامی است.');
  }

  let rows: { timeValue: string | null }[];

  if (date) {
    const { start, end } = iranDayBounds(date);
    rows = await prisma.booking.findMany({
      where: {
        doctorId: String(doctorId),
        type,
        status: { not: 'cancelled' },
        appointmentAt: { gte: start, lte: end },
      },
      select: { timeValue: true },
    });
  } else {
    rows = await prisma.booking.findMany({
      where: {
        doctorId: String(doctorId),
        day: day!,
        type,
        status: { not: 'cancelled' },
      },
      select: { timeValue: true },
    });
  }

  return NextResponse.json({
    timeValues: rows.map((r) => r.timeValue).filter((v): v is string => Boolean(v)),
  });
}
