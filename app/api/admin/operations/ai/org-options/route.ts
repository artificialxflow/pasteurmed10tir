import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const rows = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      representative: { select: { phone: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      representativePhone: row.representative.phone,
    })),
  });
}
