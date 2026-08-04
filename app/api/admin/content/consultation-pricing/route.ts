import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
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
  return NextResponse.json({
    consultationTypes: types,
    specialtyTariffs: (tariffRow?.tariffs as SpecialtyTariffs) || {},
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('consultationPrices');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    consultationTypes?: ConsultationTypeBody[];
    specialtyTariffs?: SpecialtyTariffs;
  }>(request);
  if (!body?.consultationTypes) return jsonError('درخواست نامعتبر است.');

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
      create: { id: 'default', tariffs: body.specialtyTariffs || {} },
      update: { tariffs: body.specialtyTariffs || {} },
    }),
  ]);

  return NextResponse.json({
    consultationTypes: types,
    specialtyTariffs: body.specialtyTariffs || {},
  });
}
