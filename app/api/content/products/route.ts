import { toProductDto } from '@/lib/content/product-utils';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: { categoryRel: true },
  });
  return NextResponse.json({ items: items.map(toProductDto) });
}
