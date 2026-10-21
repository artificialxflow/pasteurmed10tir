import { filterStandardConsultationTypes } from '@/lib/consultation/standard-types';
import { mergeTariffStore, splitTariffStore } from '@/lib/consultation/home-visit';
import { prisma } from '@/lib/prisma';
import type { SpecialtyTariffs } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function GET() {
  const [typesRaw, tariffRow] = await Promise.all([
    prisma.consultationType.findMany({ orderBy: { id: 'asc' } }),
    prisma.specialtyTariff.findUnique({ where: { id: 'default' } }),
  ]);
  const types = filterStandardConsultationTypes(typesRaw);
  const raw = (tariffRow?.tariffs as SpecialtyTariffs) || {};
  const { specialtyTariffs, homeVisitTariffs } = splitTariffStore(raw);
  return NextResponse.json({
    consultationTypes: types,
    specialtyTariffs,
    homeVisitTariffs,
  });
}
