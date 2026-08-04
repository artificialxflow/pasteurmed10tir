import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await prisma.nursingService.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
  return NextResponse.json({
    items: items
      .filter((s) => s.active)
      .map(({ items, ...s }) => ({
        ...s,
        items: items.filter((i) => i.active),
      })),
  });
}
