import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type ItemBody = {
  id: string;
  title: string;
  priceNum: number;
  price?: string;
  unit?: string;
  active?: boolean;
};

type CategoryBody = {
  id: string;
  title: string;
  emoji?: string;
  description?: string;
  active?: boolean;
  items?: ItemBody[];
};

export async function GET() {
  const auth = await requireAdmin('dental-tariffs');
  if (auth.error) return auth.error;
  const items = await prisma.dentalTariffCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('dental-tariffs');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: CategoryBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const created = await prisma.$transaction(async (tx) => {
    await tx.dentalTariffItem.deleteMany();
    await tx.dentalTariffCategory.deleteMany();

    const rows = [];
    for (let si = 0; si < body.items!.length; si++) {
      const s = body.items![si];
      const category = await tx.dentalTariffCategory.create({
        data: {
          id: String(s.id || `dental-tariff-${si}`),
          title: String(s.title || '').trim(),
          emoji: String(s.emoji || '🦷').trim() || '🦷',
          description: String(s.description || '').trim(),
          active: s.active !== false,
          sortOrder: si,
          items: {
            create: (s.items || []).map((item, ii) => ({
              id: String(item.id || `dti-${si}-${ii}`),
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
      rows.push(category);
    }
    return rows;
  });

  return NextResponse.json({ items: created });
}
