import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function mapClinic(row: {
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

export async function GET() {
  const auth = await requireAdmin('dental-tariffs');
  if (auth.error) return auth.error;
  const rows = await prisma.competitorClinic.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ items: rows.map(mapClinic) });
}

export async function POST(request: Request) {
  const auth = await requireAdmin('dental-tariffs');
  if (auth.error) return auth.error;
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  const clinicName = String(body.clinicName || '').trim();
  if (clinicName.length < 2) return jsonError('نام کلینیک الزامی است.');

  const num = (k: string) => {
    const v = Number(body[k]);
    return Number.isFinite(v) ? Math.round(v) : null;
  };

  const row = await prisma.competitorClinic.create({
    data: {
      clinicName,
      managementName: String(body.managementName || '').trim() || null,
      city: String(body.city || '').trim() || null,
      region: String(body.region || '').trim() || null,
      moreSpecializedPct: num('moreSpecializedPct'),
      services: String(body.services || '').trim() || null,
      equipment: String(body.equipment || '').trim() || null,
      generalDentistCount: num('generalDentistCount'),
      specialistDentistCount: num('specialistDentistCount'),
      website: String(body.website || '').trim() || null,
      websiteDomain: String(body.websiteDomain || '').trim() || null,
      onlineServices: String(body.onlineServices || '').trim() || null,
      instagramPage: String(body.instagramPage || '').trim() || null,
      followerCount: num('followerCount'),
      engagementRate: num('engagementRate'),
      contentType: String(body.contentType || '').trim() || null,
      mapsFeedback: String(body.mapsFeedback || '').trim() || null,
      commentReaction: String(body.commentReaction || '').trim() || null,
      strengths: String(body.strengths || '').trim() || null,
      weaknesses: String(body.weaknesses || '').trim() || null,
      strategyScore: num('strategyScore'),
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

  return NextResponse.json({ item: row });
}
