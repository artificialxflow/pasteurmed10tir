import { jsonError } from '@/lib/auth/api-utils';
import { toProductDto } from '@/lib/content/product-utils';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
    include: { categoryRel: true },
  });

  if (!product) return jsonError('محصول یافت نشد.', 404);

  return NextResponse.json({ item: toProductDto(product) });
}
