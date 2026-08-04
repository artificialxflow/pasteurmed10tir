import { jsonError } from '@/lib/auth/api-utils';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctorId');
  const day = searchParams.get('day');
  const type = searchParams.get('type');

  if (!doctorId || !day || !type) {
    return jsonError('پارامترهای occupied ناقص است.');
  }

  const rows = await prisma.booking.findMany({
    where: {
      doctorId: String(doctorId),
      day,
      type,
      status: { not: 'cancelled' },
    },
    select: { timeValue: true },
  });

  return NextResponse.json({
    timeValues: rows.map((r) => r.timeValue).filter((v): v is string => Boolean(v)),
  });
}
