import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await prisma.physician.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json({ items });
}
