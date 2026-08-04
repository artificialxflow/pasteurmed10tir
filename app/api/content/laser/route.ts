import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await prisma.laserService.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ items: items.filter((s) => s.active) });
}
