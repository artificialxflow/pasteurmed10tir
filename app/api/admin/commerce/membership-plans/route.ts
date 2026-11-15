import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapMembershipPlan } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { PASTEUR_DATA } from '@/lib/data';
import { ACTIVE_MEMBERSHIP_PLAN_IDS } from '@/lib/membership';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const isActivePlanId = (id: string) =>
  (ACTIVE_MEMBERSHIP_PLAN_IDS as readonly string[]).includes(id);

export async function GET() {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const rows = await prisma.membershipPlan.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({
    items: rows.filter((m) => isActivePlanId(m.id)).map(mapMembershipPlan),
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: Array<Record<string, unknown>>; reset?: boolean }>(
    request,
  );
  if (!body) return jsonError('درخواست نامعتبر است.');

  const source = body.reset
    ? PASTEUR_DATA.memberships.filter((m) => isActivePlanId(m.id))
    : Array.isArray(body.items)
      ? body.items
      : null;

  if (!source) return jsonError('لیست طرح‌ها الزامی است.');

  const cleaned = source
    .filter((m) => isActivePlanId(String(m.id)))
    .map((m, index) => ({
      id: String(m.id),
      name: String(m.name || ''),
      price: String(m.price || ''),
      priceNum: Number(m.priceNum || 0),
      loanTermLabel: String(m.loanTermLabel || ''),
      loanLimit: Number(m.loanLimit || 0),
      downPaymentPercent: Number(m.downPaymentPercent || 0),
      features: Array.isArray(m.features) ? m.features.map(String) : [],
      terms: String(m.terms || ''),
      highlighted: Boolean(m.highlighted),
      sortOrder: index,
    }));

  await prisma.$transaction([
    prisma.membershipPlan.deleteMany({}),
    ...cleaned.map((item) => prisma.membershipPlan.create({ data: item })),
  ]);

  const rows = await prisma.membershipPlan.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ items: rows.map(mapMembershipPlan) });
}
