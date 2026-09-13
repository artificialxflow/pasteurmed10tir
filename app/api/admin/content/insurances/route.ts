import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type InsuranceBody = {
  id: string;
  name: string;
  active?: boolean;
  showOnSite?: boolean;
  logoUrl?: string | null;
};

function cleanList(list: InsuranceBody[] | undefined) {
  return (list || [])
    .map((i) => ({
      id: String(i.id).trim(),
      name: String(i.name).trim(),
      active: i.active !== false,
      showOnSite: Boolean(i.showOnSite),
      logoUrl: i.logoUrl ? String(i.logoUrl).trim() : null,
    }))
    .filter((i) => i.id && i.name);
}

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

  const base = cleanList(body.base);
  const complementary = cleanList(body.complementary);

  await prisma.$transaction([
    prisma.baseInsurance.deleteMany(),
    prisma.complementaryInsurance.deleteMany(),
    ...base.map((i) => prisma.baseInsurance.create({ data: i })),
    ...complementary.map((i) => prisma.complementaryInsurance.create({ data: i })),
  ]);

  return NextResponse.json({ base, complementary });
}
