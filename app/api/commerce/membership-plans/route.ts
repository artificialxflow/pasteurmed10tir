import { mapMembershipPlan } from '@/lib/commerce/mappers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const rows = await prisma.membershipPlan.findMany({
    where: { id: { in: ['regular', 'vip'] } },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({ items: rows.map(mapMembershipPlan) });
}
