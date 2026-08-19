import { mapDentist } from '@/lib/content/doctor-mappers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await prisma.dentist.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  return NextResponse.json({ items: items.map(mapDentist) });
}
