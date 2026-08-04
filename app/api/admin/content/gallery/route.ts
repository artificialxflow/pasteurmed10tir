import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type GalleryBody = {
  id: number;
  category: string;
  title: string;
  before: string;
  after: string;
};

export async function GET() {
  const auth = await requireAdmin('gallery');
  if (auth.error) return auth.error;
  const items = await prisma.galleryItem.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('gallery');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: GalleryBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const cleaned = body.items.map((g, i) => ({
    id: Number(g.id) || Date.now() + i,
    category: String(g.category || 'dental').trim(),
    title: String(g.title || '').trim(),
    before: String(g.before || '/uploads/placeholder.svg').trim(),
    after: String(g.after || '/uploads/placeholder.svg').trim(),
  }));

  await prisma.$transaction([
    prisma.galleryItem.deleteMany(),
    ...cleaned.map((g) => prisma.galleryItem.create({ data: g })),
  ]);

  return NextResponse.json({ items: cleaned });
}
