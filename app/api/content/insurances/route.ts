import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const [base, complementary] = await Promise.all([
    prisma.baseInsurance.findMany({ orderBy: { id: 'asc' } }),
    prisma.complementaryInsurance.findMany({ orderBy: { id: 'asc' } }),
  ]);
  return NextResponse.json({
    base: base.filter((i) => i.active),
    complementary: complementary.filter((i) => i.active),
  });
}
