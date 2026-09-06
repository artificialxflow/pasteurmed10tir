import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await prisma.dentalTariffCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
  return NextResponse.json({
    items: items
      .filter((s) => s.active)
      .map(({ items: rows, ...s }) => ({
        ...s,
        items: rows.filter((i) => i.active),
      })),
  });
}
