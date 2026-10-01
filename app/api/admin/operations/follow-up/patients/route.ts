import { jsonError } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();
  if (q.length < 2) {
    return NextResponse.json({ items: [] as Array<{ name: string; phone: string }> });
  }

  const phoneDigits = normalizePhoneDigits(q);
  const users = await prisma.user.findMany({
    where: {
      profile: { is: { status: 'approved' } },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        ...(phoneDigits.length >= 4 ? [{ phone: { contains: phoneDigits } }] : []),
      ],
    },
    select: { name: true, phone: true },
    orderBy: { name: 'asc' },
    take: 20,
  });

  return NextResponse.json({
    items: users.map((u) => ({ name: u.name, phone: u.phone })),
  });
}

export async function POST() {
  return jsonError('Method not allowed', 405);
}
