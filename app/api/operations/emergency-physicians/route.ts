import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

/** لیست پزشکان اورژانس فعال — برای انتخاب «ثبت‌کننده» در پرونده سلامت */
export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  try {
    const items = await prisma.emergencyPhysician.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    });
    return NextResponse.json({ items });
  } catch (e) {
    return prismaRouteError(e, 'operations/emergency-physicians GET');
  }
}
