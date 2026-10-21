import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin('dental-tariffs');
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const row = await prisma.competitorClinic.findUnique({
    where: { id },
    include: {
      prices: {
        include: { dentalTariffItem: { select: { id: true, title: true, priceNum: true } } },
      },
    },
  });
  if (!row) return jsonError('مرکز یافت نشد.', 404);
  return NextResponse.json({ item: row });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin('dental-tariffs');
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const num = (k: string) => {
    const v = Number(body[k]);
    return Number.isFinite(v) ? Math.round(v) : null;
  };

  const data: Record<string, unknown> = {};
  const str = (k: string) => {
    if (body[k] !== undefined) data[k] = String(body[k] || '').trim() || null;
  };
  [
    'clinicName',
    'managementName',
    'city',
    'region',
    'services',
    'equipment',
    'website',
    'websiteDomain',
    'onlineServices',
    'instagramPage',
    'contentType',
    'mapsFeedback',
    'commentReaction',
    'strengths',
    'weaknesses',
    'notes',
  ].forEach(str);
  if (body.clinicName !== undefined) {
    const name = String(body.clinicName || '').trim();
    if (name.length < 2) return jsonError('نام کلینیک الزامی است.');
    data.clinicName = name;
  }
  [
    'moreSpecializedPct',
    'generalDentistCount',
    'specialistDentistCount',
    'followerCount',
    'engagementRate',
    'strategyScore',
  ].forEach((k) => {
    if (body[k] !== undefined) data[k] = num(k);
  });

  const prices = body.prices;
  if (Array.isArray(prices)) {
    for (const p of prices) {
      const itemId = String((p as { dentalTariffItemId?: string }).dentalTariffItemId || '');
      if (!itemId) continue;
      const priceNumRaw = (p as { priceNum?: unknown }).priceNum;
      const priceNum =
        priceNumRaw === null || priceNumRaw === ''
          ? null
          : Number.isFinite(Number(priceNumRaw))
            ? Math.round(Number(priceNumRaw))
            : null;
      await prisma.competitorClinicPrice.upsert({
        where: {
          competitorId_dentalTariffItemId: { competitorId: id, dentalTariffItemId: itemId },
        },
        create: { competitorId: id, dentalTariffItemId: itemId, priceNum },
        update: { priceNum },
      });
    }
  }

  const row = await prisma.competitorClinic.update({
    where: { id },
    data,
    include: {
      prices: {
        include: { dentalTariffItem: { select: { id: true, title: true, priceNum: true } } },
      },
    },
  });
  return NextResponse.json({ item: row });
}
