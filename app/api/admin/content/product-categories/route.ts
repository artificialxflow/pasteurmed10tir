import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { assignIntIds } from '@/lib/content/int-id';
import {
  ensureUniqueSlug,
  slugifyFa,
  toCategoryDto,
} from '@/lib/content/product-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type CategoryBody = {
  id: number;
  name: string;
  slug?: string;
  sortOrder?: number;
  active?: boolean;
};

export async function GET() {
  const auth = await requireAdmin('shop');
  if (auth.error) return auth.error;

  const items = await prisma.productCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  return NextResponse.json({ items: items.map(toCategoryDto) });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('shop');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: CategoryBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const cleaned = assignIntIds(
    body.items
      .map((c) => ({
        id: Number(c.id),
        name: String(c.name || '').trim(),
        slug: String(c.slug || '').trim() || slugifyFa(c.name),
        sortOrder: Number(c.sortOrder || 0),
        active: c.active !== false,
      }))
      .filter((c) => c.name),
  );

  const slugSet = new Set<string>();
  for (const c of cleaned) {
    c.slug = ensureUniqueSlug(c.slug || c.name, slugSet);
  }

  const existing = await prisma.productCategory.findMany();
  const removedIds = existing
    .map((c) => c.id)
    .filter((id) => !cleaned.some((c) => c.id === id));

  if (removedIds.length) {
    const inUse = await prisma.product.count({
      where: { categoryId: { in: removedIds } },
    });
    if (inUse > 0) {
      return jsonError('دسته‌ای که محصول دارد قابل حذف نیست. ابتدا محصولات را منتقل کنید.');
    }
  }

  await prisma.$transaction(async (tx) => {
    const keepIds = cleaned.map((c) => c.id);
    await tx.productCategory.deleteMany({
      where: keepIds.length ? { id: { notIn: keepIds } } : {},
    });
    for (const c of cleaned) {
      await tx.productCategory.upsert({
        where: { id: c.id },
        create: c,
        update: {
          name: c.name,
          slug: c.slug,
          sortOrder: c.sortOrder,
          active: c.active,
        },
      });
    }
  });

  const items = await prisma.productCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  return NextResponse.json({ items: items.map(toCategoryDto) });
}
