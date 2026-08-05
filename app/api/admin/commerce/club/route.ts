import { mapClubProfile } from '@/lib/club/service';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('club');
  if (auth.error) return auth.error;

  const rows = await prisma.clubProfile.findMany({
    include: { history: { orderBy: { createdAt: 'desc' }, take: 5 } },
    orderBy: { points: 'desc' },
  });

  return NextResponse.json({ items: rows.map(mapClubProfile) });
}
