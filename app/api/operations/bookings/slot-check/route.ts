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
  const timeValue = searchParams.get('timeValue');

  if (!doctorId || !type || timeValue == null) {
    return jsonError('پارامترهای slot-check ناقص است.');
  }

  if (!date && !day) {
    return jsonError('تاریخ یا روز حضور الزامی است.');
  }

  let taken = false;

  if (date) {
    const { start, end } = iranDayBounds(date);
    const row = await prisma.booking.findFirst({
      where: {
        status: { not: 'cancelled' },
        doctorId: String(doctorId),
        type,
        timeValue: String(timeValue),
        appointmentAt: { gte: start, lte: end },
      },
    });
    taken = Boolean(row);
  } else {
    const row = await prisma.booking.findFirst({
      where: {
        status: { not: 'cancelled' },
        doctorId: String(doctorId),
        day: day!,
        type,
        timeValue: String(timeValue),
      },
    });
    taken = Boolean(row);
  }

  return NextResponse.json({ taken });
}
