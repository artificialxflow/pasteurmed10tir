import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type ProductBody = {
  id: number;
  name: string;
  category: string;
  price: string;
  priceNum: number;
  stock: number;
  image: string;
};

export async function GET() {
  const auth = await requireAdmin('shop');
  if (auth.error) return auth.error;
  const items = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('shop');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: ProductBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const cleaned = body.items.map((p, i) => ({
    id: Number(p.id) || i + 1,
    name: String(p.name || '').trim(),
    category: String(p.category || 'پزشکی').trim(),
    price: String(p.price || '').trim(),
    priceNum: Number(p.priceNum || 0),
    stock: Number(p.stock || 0),
    image: String(p.image || '/uploads/placeholder.svg').trim(),
  }));

  await prisma.$transaction([
    prisma.product.deleteMany(),
    ...cleaned.map((p) => prisma.product.create({ data: p })),
  ]);

  return NextResponse.json({ items: cleaned });
}
