import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { assignIntIds } from '@/lib/content/int-id';
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

  try {
    const items = await prisma.galleryItem.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json({ items });
  } catch (e) {
    console.error('[gallery GET]', e);
    return jsonError('خطا در بارگذاری گالری.', 500);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('gallery');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: GalleryBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const cleaned = assignIntIds(
    body.items.map((g) => ({
      id: Number(g.id),
      category: String(g.category || 'dental').trim(),
      title: String(g.title || '').trim(),
      before: String(g.before || '/uploads/placeholder.svg').trim(),
      after: String(g.after || '/uploads/placeholder.svg').trim(),
    })),
  ).filter((g) => g.title);

  try {
    await prisma.$transaction([
      prisma.galleryItem.deleteMany(),
      ...cleaned.map((g) => prisma.galleryItem.create({ data: g })),
    ]);
    return NextResponse.json({ items: cleaned });
  } catch (e) {
    console.error('[gallery PUT]', e);
    return jsonError('ذخیره گالری ناموفق بود.', 500);
  }
}
