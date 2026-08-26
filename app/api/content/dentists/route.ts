import { mapDentist } from '@/lib/content/doctor-mappers';
import { ensureDefaultDentists } from '@/lib/content/ensure-dentists';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await ensureDefaultDentists();
    const items = await prisma.dentist.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return NextResponse.json({ items: items.map(mapDentist) });
  } catch (e) {
    return prismaRouteError(e, 'content/dentists GET');
  }
}
