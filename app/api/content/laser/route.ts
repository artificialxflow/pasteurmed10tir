import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const [categories, services] = await Promise.all([
    prisma.laserCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.laserService.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { category: true },
    }),
  ]);

  const activeCategories = categories.filter((c) => c.active);
  const items = services
    .filter((s) => s.active)
    .map((s) => ({
      id: s.id,
      title: s.title,
      emoji: s.emoji,
      price: s.price,
      priceNum: s.priceNum,
      description: s.description,
      categoryId: s.categoryId,
      categoryName: s.category?.name ?? null,
      active: s.active,
    }));

  return NextResponse.json({
    categories: activeCategories.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      active: c.active,
      sortOrder: c.sortOrder,
    })),
    items,
  });
}
