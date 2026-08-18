import { toCategoryDto } from '@/lib/content/product-utils';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await prisma.productCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  return NextResponse.json({ items: items.map(toCategoryDto) });
}
