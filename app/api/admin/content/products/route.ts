import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { assignIntIds } from '@/lib/content/int-id';
import {
  sanitizeProductInput,
  toProductDto,
  type ProductInput,
} from '@/lib/content/product-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('shop');
  if (auth.error) return auth.error;

  const items = await prisma.product.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: { categoryRel: true },
  });
  return NextResponse.json({ items: items.map(toProductDto) });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('shop');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: ProductInput[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const categories = await prisma.productCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  if (!categories.length) {
    return jsonError('ابتدا حداقل یک دسته‌بندی تعریف کنید.');
  }

  const withIds = assignIntIds(body.items.map((p) => ({ ...p, id: Number(p.id) })));
  const slugSet = new Set<string>();
  const cleaned = withIds
    .map((p) => sanitizeProductInput(p, categories, slugSet))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  for (const item of cleaned) {
    if (item.images.some((img) => !img.startsWith('/uploads/'))) {
      return jsonError('تصاویر محصول باید از مسیر /uploads/ باشند.');
    }
  }

  await prisma.$transaction(async (tx) => {
    const keepIds = cleaned.map((p) => p.id);
    await tx.product.deleteMany({
      where: keepIds.length ? { id: { notIn: keepIds } } : {},
    });
    for (const p of cleaned) {
      await tx.product.upsert({
        where: { id: p.id },
        create: p,
        update: p,
      });
    }
  });

  const items = await prisma.product.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: { categoryRel: true },
  });
  return NextResponse.json({ items: items.map(toProductDto) });
}
