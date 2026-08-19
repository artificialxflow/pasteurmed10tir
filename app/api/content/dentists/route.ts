import { mapDentist } from '@/lib/content/doctor-mappers';
import { PASTEUR_DATA } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await prisma.dentist.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  if (items.length === 0) {
    return NextResponse.json({ items: PASTEUR_DATA.dentists });
  }
  return NextResponse.json({ items: items.map(mapDentist) });
}
