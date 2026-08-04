import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type ServiceBody = {
  id: string;
  title: string;
  emoji?: string;
  description?: string;
  href: string;
  image: string;
  color?: string;
  active?: boolean;
};

export async function GET() {
  const auth = await requireAdmin('services');
  if (auth.error) return auth.error;
  const items = await prisma.service.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('services');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: ServiceBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const cleaned = body.items
    .map((s, i) => ({
      id: String(s.id || `service-${i}`),
      title: String(s.title || '').trim(),
      emoji: String(s.emoji || '🧩').trim() || '🧩',
      description: String(s.description || '').trim(),
      href: String(s.href || '').trim(),
      image: String(s.image || '/uploads/placeholder.svg').trim(),
      color: String(s.color || 'teal'),
      active: s.active !== false,
      sortOrder: i,
    }))
    .filter((s) => s.title && s.href);

  await prisma.$transaction([
    prisma.service.deleteMany(),
    ...cleaned.map((s) => prisma.service.create({ data: s })),
  ]);

  return NextResponse.json({ items: cleaned });
}
