import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import {
  DEFAULT_HOME_VISIT_TARIFFS,
  mergeTariffStore,
  splitTariffStore,
  type HomeVisitTariffs,
} from '@/lib/consultation/home-visit';
import { prisma } from '@/lib/prisma';
import type { SpecialtyTariffs } from '@/lib/data';
import { NextResponse } from 'next/server';

type ConsultationTypeBody = {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  priceNum?: number;
  price?: string;
};

export async function GET() {
  const auth = await requireAdmin('consultationPrices');
  if (auth.error) return auth.error;
  const [types, tariffRow] = await Promise.all([
    prisma.consultationType.findMany({ orderBy: { id: 'asc' } }),
    prisma.specialtyTariff.findUnique({ where: { id: 'default' } }),
  ]);
  const raw = (tariffRow?.tariffs as SpecialtyTariffs) || {};
  const { specialtyTariffs, homeVisitTariffs } = splitTariffStore(raw);
  return NextResponse.json({
    consultationTypes: types,
    specialtyTariffs,
    homeVisitTariffs,
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('consultationPrices');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    consultationTypes?: ConsultationTypeBody[];
    specialtyTariffs?: SpecialtyTariffs;
    homeVisitTariffs?: HomeVisitTariffs;
  }>(request);
  if (!body?.consultationTypes) return jsonError('درخواست نامعتبر است.');

  const mergedTariffs = mergeTariffStore(
    body.specialtyTariffs || {},
    body.homeVisitTariffs || DEFAULT_HOME_VISIT_TARIFFS,
  );

  const types = body.consultationTypes.map((t) => ({
    id: String(t.id),
    label: String(t.label),
    emoji: String(t.emoji),
    desc: String(t.desc),
    priceNum: t.priceNum != null ? Number(t.priceNum) : null,
    price: t.price?.trim() || null,
  }));

  await prisma.$transaction([
    prisma.consultationType.deleteMany(),
    ...types.map((t) => prisma.consultationType.create({ data: t })),
    prisma.specialtyTariff.upsert({
      where: { id: 'default' },
      create: { id: 'default', tariffs: mergedTariffs },
      update: { tariffs: mergedTariffs },
    }),
  ]);

  const { specialtyTariffs, homeVisitTariffs } = splitTariffStore(mergedTariffs);

  return NextResponse.json({
    consultationTypes: types,
    specialtyTariffs,
    homeVisitTariffs,
  });
}
