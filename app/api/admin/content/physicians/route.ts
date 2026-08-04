import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type PhysicianBody = {
  id: number;
  name: string;
  specialty: string;
  specialtyId?: string;
  image: string;
  days: string[];
  status?: string;
};

export async function GET() {
  const auth = await requireAdmin('doctors');
  if (auth.error) return auth.error;
  const items = await prisma.physician.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('doctors');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: PhysicianBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const cleaned = body.items.map((p, i) => ({
    id: Number(p.id) || i + 1,
    name: String(p.name || '').trim(),
    specialty: String(p.specialty || '').trim(),
    specialtyId: p.specialtyId?.trim() || null,
    image: String(p.image || '/uploads/placeholder.svg').trim(),
    days: Array.isArray(p.days) ? p.days.map(String) : [],
    status: String(p.status || 'available'),
  }));

  await prisma.$transaction([
    prisma.physician.deleteMany(),
    ...cleaned.map((p) => prisma.physician.create({ data: p })),
  ]);

  return NextResponse.json({ items: cleaned });
}
