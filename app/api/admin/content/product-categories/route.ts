import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { assignIntIds } from '@/lib/content/int-id';
import { ensureUniqueSlugLiteral } from '@/lib/content/product-slug';
import { toCategoryDto } from '@/lib/content/product-utils';
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

const MIGRATE_HINT =
  'احتمالاً migration فروشگاه اجرا نشده. روی سرور: npx prisma migrate deploy';

function isSchemaError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err);
  return (
    msg.includes('ProductCategory') ||
    msg.includes('does not exist') ||
    msg.includes('column') ||
    msg.includes('P2021') ||
    msg.includes('P2022')
  );
}

export async function GET() {
  const auth = await requireAdmin('shop');
  if (auth.error) return auth.error;

  try {
    const items = await prisma.productCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return NextResponse.json({ items: items.map(toCategoryDto) });
  } catch (e) {
    console.error('[product-categories GET]', e);
    if (isSchemaError(e)) return jsonError(MIGRATE_HINT, 500);
    return jsonError('خطا در بارگذاری دسته‌ها.', 500);
  }
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
        slug: String(c.slug || '').trim() || String(c.name || '').trim(),
        sortOrder: Number(c.sortOrder || 0),
        active: c.active !== false,
      }))
      .filter((c) => c.name),
  );

  const slugSet = new Set<string>();
  for (const c of cleaned) {
    c.slug = ensureUniqueSlugLiteral(c.slug || c.name, slugSet);
  }

  try {
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
  } catch (e) {
    console.error('[product-categories PUT]', e);
    if (isSchemaError(e)) return jsonError(MIGRATE_HINT, 500);
    return jsonError('ذخیره دسته‌ها ناموفق بود.', 500);
  }
}
