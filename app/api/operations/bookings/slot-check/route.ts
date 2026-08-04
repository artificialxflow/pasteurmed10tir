import { jsonError } from '@/lib/auth/api-utils';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctorId');
  const day = searchParams.get('day');
  const type = searchParams.get('type');
  const timeValue = searchParams.get('timeValue');

  if (!doctorId || !day || !type || timeValue == null) {
    return jsonError('پارامترهای slot-check ناقص است.');
  }

  const taken = await prisma.booking.findFirst({
    where: {
      status: { not: 'cancelled' },
      doctorId: String(doctorId),
      day,
      type,
      timeValue: String(timeValue),
    },
  });

  return NextResponse.json({ taken: Boolean(taken) });
}
