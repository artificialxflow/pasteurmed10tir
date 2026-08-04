import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  const filtered = items.filter((p) =>
    ['پزشکی', 'دندانپزشکی'].includes(p.category),
  );
  return NextResponse.json({ items: filtered });
}
