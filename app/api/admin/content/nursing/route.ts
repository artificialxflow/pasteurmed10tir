import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type NursingItemBody = {
  id: string;
  title: string;
  priceNum: number;
  price?: string;
  unit?: string;
  active?: boolean;
};

type NursingBody = {
  id: string;
  title: string;
  emoji?: string;
  price: string;
  description?: string;
  image?: string;
  active?: boolean;
  items?: NursingItemBody[];
};

export async function GET() {
  const auth = await requireAdmin('nursingServices');
  if (auth.error) return auth.error;
  const items = await prisma.nursingService.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('nursingServices');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: NursingBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  await prisma.nursingItem.deleteMany();
  await prisma.nursingService.deleteMany();

  const created = [];
  for (let si = 0; si < body.items.length; si++) {
    const s = body.items[si];
    const service = await prisma.nursingService.create({
      data: {
        id: String(s.id || `nursing-${si}`),
        title: String(s.title || '').trim(),
        emoji: String(s.emoji || '💉').trim() || '💉',
        price: String(s.price || '').trim(),
        description: String(s.description || '').trim(),
        image: s.image?.trim() || null,
        active: s.active !== false,
        sortOrder: si,
        items: {
          create: (s.items || []).map((item, ii) => ({
            id: String(item.id || `ni-${si}-${ii}`),
            title: String(item.title || '').trim(),
            priceNum: Number(item.priceNum || 0),
            price: item.price?.trim() || null,
            unit: item.unit?.trim() || null,
            active: item.active !== false,
            sortOrder: ii,
          })),
        },
      },
      include: { items: true },
    });
    created.push(service);
  }

  return NextResponse.json({ items: created });
}
