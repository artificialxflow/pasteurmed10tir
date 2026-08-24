import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { generateCommerceId } from '@/lib/commerce/mappers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function mapClip(row: {
  id: string;
  title: string;
  level: string;
  description: string;
  videoUrl: string;
  durationLabel: string;
  sortOrder: number;
  active: boolean;
}) {
  return {
    id: row.id,
    title: row.title,
    level: row.level,
    description: row.description,
    videoUrl: row.videoUrl,
    durationLabel: row.durationLabel,
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

export async function GET() {
  const auth = await requireAdmin('services');
  if (auth.error) return auth.error;
  const rows = await prisma.dentalEducationClip.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json({ items: rows.map(mapClip) });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('services');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: Array<Record<string, unknown>> }>(request);
  if (!body?.items) return jsonError('لیست کلیپ‌ها الزامی است.');

  const cleaned = body.items
    .map((item, index) => ({
      id: String(item.id || generateCommerceId()),
      title: String(item.title || '').trim(),
      level: String(item.level || '').trim(),
      description: String(item.description || '').trim(),
      videoUrl: String(item.videoUrl || '').trim(),
      durationLabel: String(item.durationLabel || '').trim(),
      sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
      active: item.active !== false,
    }))
    .filter((item) => item.title);

  await prisma.$transaction([
    prisma.dentalEducationClip.deleteMany(),
    ...cleaned.map((item) =>
      prisma.dentalEducationClip.create({
        data: item,
      }),
    ),
  ]);

  return NextResponse.json({ items: cleaned });
}
