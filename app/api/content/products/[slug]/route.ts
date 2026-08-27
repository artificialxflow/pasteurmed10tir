import { jsonError } from '@/lib/auth/api-utils';
import { toProductDto } from '@/lib/content/product-utils';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug: raw } = await params;
  let key = String(raw || '').trim();
  try {
    key = decodeURIComponent(key);
  } catch {
    // keep raw
  }

  const asId = Number(key);
  const byId = Number.isFinite(asId) && String(asId) === key && asId > 0;

  const product = await prisma.product.findFirst({
    where: {
      active: true,
      OR: [{ slug: key }, ...(byId ? [{ id: asId }] : [])],
    },
    include: { categoryRel: true },
  });

  if (!product) return jsonError('محصول یافت نشد.', 404);

  return NextResponse.json({ item: toProductDto(product) });
}
