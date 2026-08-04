import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type InsuranceBody = { id: string; name: string; active?: boolean };

export async function GET() {
  const auth = await requireAdmin('insurances');
  if (auth.error) return auth.error;
  const [base, complementary] = await Promise.all([
    prisma.baseInsurance.findMany({ orderBy: { id: 'asc' } }),
    prisma.complementaryInsurance.findMany({ orderBy: { id: 'asc' } }),
  ]);
  return NextResponse.json({ base, complementary });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('insurances');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    base?: InsuranceBody[];
    complementary?: InsuranceBody[];
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const base = (body.base || []).map((i) => ({
    id: String(i.id).trim(),
    name: String(i.name).trim(),
    active: i.active !== false,
  }));
  const complementary = (body.complementary || []).map((i) => ({
    id: String(i.id).trim(),
    name: String(i.name).trim(),
    active: i.active !== false,
  }));

  await prisma.$transaction([
    prisma.baseInsurance.deleteMany(),
    prisma.complementaryInsurance.deleteMany(),
    ...base.map((i) => prisma.baseInsurance.create({ data: i })),
    ...complementary.map((i) => prisma.complementaryInsurance.create({ data: i })),
  ]);

  return NextResponse.json({ base, complementary });
}
