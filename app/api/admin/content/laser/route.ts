import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type LaserBody = {
  id: string;
  title: string;
  emoji?: string;
  price: string;
  priceNum?: number;
  description?: string;
  active?: boolean;
};

export async function GET() {
  const auth = await requireAdmin('laserServices');
  if (auth.error) return auth.error;
  const items = await prisma.laserService.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('laserServices');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: LaserBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const cleaned = body.items
    .map((s, i) => ({
      id: String(s.id || `laser-${i}`),
      title: String(s.title || '').trim(),
      emoji: String(s.emoji || '✨').trim() || '✨',
      price: String(s.price || '').trim(),
      priceNum: s.priceNum != null ? Number(s.priceNum) : null,
      description: s.description?.trim() || null,
      active: s.active !== false,
      sortOrder: i,
    }))
    .filter((s) => s.title);

  await prisma.$transaction([
    prisma.laserService.deleteMany(),
    ...cleaned.map((s) => prisma.laserService.create({ data: s })),
  ]);

  return NextResponse.json({ items: cleaned });
}
