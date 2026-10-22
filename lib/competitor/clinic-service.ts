import { prisma } from '@/lib/prisma';

export function mapCompetitorClinicListItem(row: {
  id: string;
  clinicName: string;
  city: string | null;
  region: string | null;
  updatedAt: Date;
  createdAt: Date;
}) {
  return {
    id: row.id,
    clinicName: row.clinicName,
    city: row.city,
    region: row.region,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listCompetitorClinics(limit = 200) {
  const rows = await prisma.competitorClinic.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
  return rows.map(mapCompetitorClinicListItem);
}

function parseNum(body: Record<string, unknown>, k: string): number | null {
  const v = Number(body[k]);
  return Number.isFinite(v) ? Math.round(v) : null;
}

export async function createCompetitorClinic(body: Record<string, unknown>) {
  const clinicName = String(body.clinicName || '').trim();
  if (clinicName.length < 2) {
    throw new Error('نام کلینیک الزامی است.');
  }

  const row = await prisma.competitorClinic.create({
    data: {
      clinicName,
      managementName: String(body.managementName || '').trim() || null,
      city: String(body.city || '').trim() || null,
      region: String(body.region || '').trim() || null,
      moreSpecializedPct: parseNum(body, 'moreSpecializedPct'),
      services: String(body.services || '').trim() || null,
      equipment: String(body.equipment || '').trim() || null,
      generalDentistCount: parseNum(body, 'generalDentistCount'),
      specialistDentistCount: parseNum(body, 'specialistDentistCount'),
      website: String(body.website || '').trim() || null,
      websiteDomain: String(body.websiteDomain || '').trim() || null,
      onlineServices: String(body.onlineServices || '').trim() || null,
      instagramPage: String(body.instagramPage || '').trim() || null,
      followerCount: parseNum(body, 'followerCount'),
      engagementRate: parseNum(body, 'engagementRate'),
      contentType: String(body.contentType || '').trim() || null,
      mapsFeedback: String(body.mapsFeedback || '').trim() || null,
      commentReaction: String(body.commentReaction || '').trim() || null,
      strengths: String(body.strengths || '').trim() || null,
      weaknesses: String(body.weaknesses || '').trim() || null,
      strategyScore: parseNum(body, 'strategyScore'),
      notes: String(body.notes || '').trim() || null,
    },
  });

  const items = await prisma.dentalTariffItem.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }],
    select: { id: true },
  });
  if (items.length) {
    await prisma.competitorClinicPrice.createMany({
      data: items.map((item) => ({
        competitorId: row.id,
        dentalTariffItemId: item.id,
        priceNum: null,
      })),
      skipDuplicates: true,
    });
  }

  return row;
}

export async function getCompetitorClinicById(id: string) {
  return prisma.competitorClinic.findUnique({
    where: { id },
    include: {
      prices: {
        include: { dentalTariffItem: { select: { id: true, title: true, priceNum: true } } },
      },
    },
  });
}

export async function updateCompetitorClinic(id: string, body: Record<string, unknown>) {
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
    if (name.length < 2) throw new Error('نام کلینیک الزامی است.');
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
    if (body[k] !== undefined) data[k] = parseNum(body, k);
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

  return prisma.competitorClinic.update({
    where: { id },
    data,
    include: {
      prices: {
        include: { dentalTariffItem: { select: { id: true, title: true, priceNum: true } } },
      },
    },
  });
}
