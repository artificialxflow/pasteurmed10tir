import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const rows = await prisma.dentalEducationClip.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      level: row.level,
      description: row.description,
      videoUrl: row.videoUrl,
      durationLabel: row.durationLabel || row.level,
      duration: row.durationLabel,
    })),
  });
}
