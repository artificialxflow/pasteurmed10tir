import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type LaserCategoryBody = {
  id: string;
  name: string;
  emoji?: string;
  active?: boolean;
};

type LaserBody = {
  id: string;
  title: string;
  emoji?: string;
  price: string;
  priceNum?: number;
  description?: string;
  categoryId?: string | null;
  active?: boolean;
};

export async function GET() {
  const auth = await requireAdmin('laserServices');
  if (auth.error) return auth.error;

  const [categories, items] = await Promise.all([
    prisma.laserCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.laserService.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { category: true },
    }),
  ]);

  return NextResponse.json({
    categories,
    items: items.map((s) => ({
      id: s.id,
      title: s.title,
      emoji: s.emoji,
      price: s.price,
      priceNum: s.priceNum,
      description: s.description,
      categoryId: s.categoryId,
      categoryName: s.category?.name ?? null,
      active: s.active,
    })),
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('laserServices');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: LaserBody[]; categories?: LaserCategoryBody[] }>(
    request,
  );
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const categories = (body.categories || [])
    .map((c, i) => ({
      id: String(c.id || `laser-cat-${i}`),
      name: String(c.name || '').trim(),
      emoji: String(c.emoji || '✨').trim() || '✨',
      active: c.active !== false,
      sortOrder: i,
    }))
    .filter((c) => c.name);

  const categoryIds = new Set(categories.map((c) => c.id));

  const cleaned = body.items
    .map((s, i) => {
      const categoryId = s.categoryId ? String(s.categoryId) : null;
      return {
        id: String(s.id || `laser-${i}`),
        title: String(s.title || '').trim(),
        emoji: String(s.emoji || '✨').trim() || '✨',
        price: String(s.price || '').trim(),
        priceNum: s.priceNum != null ? Number(s.priceNum) : null,
        description: s.description?.trim() || null,
        categoryId: categoryId && categoryIds.has(categoryId) ? categoryId : null,
        active: s.active !== false,
        sortOrder: i,
      };
    })
    .filter((s) => s.title);

  await prisma.$transaction(async (tx) => {
    await tx.laserService.deleteMany();
    await tx.laserCategory.deleteMany();
    for (const c of categories) {
      await tx.laserCategory.create({ data: c });
    }
    for (const s of cleaned) {
      await tx.laserService.create({ data: s });
    }
  });

  return NextResponse.json({ categories, items: cleaned });
}
