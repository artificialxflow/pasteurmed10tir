import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { parseIsoDateOnly } from '@/lib/follow-up/types';
import { generateOperationId } from '@/lib/operations/mappers';
import { prisma } from '@/lib/prisma';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

function mapRow(row: {
  id: string;
  title: string | null;
  patientName: string | null;
  patientPhone: string | null;
  followUpDate: Date | null;
  followUpNotes: string | null;
  details: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    title: row.title ?? undefined,
    patientName: row.patientName ?? undefined,
    patientPhone: row.patientPhone ?? undefined,
    followUpDate: row.followUpDate?.toISOString().slice(0, 10),
    followUpNotes: row.followUpNotes ?? undefined,
    details: row.details ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const rows = await prisma.pasteurWorkReport.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });
  return NextResponse.json({ items: rows.map(mapRow) });
}

type PostBody = {
  title?: string;
  patientName?: string;
  patientPhone?: string;
  followUpDate?: string;
  followUpNotes?: string;
  details?: string;
};

export async function POST(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const body = await parseJson<PostBody>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  try {
    const row = await prisma.pasteurWorkReport.create({
      data: {
        id: generateOperationId(),
        title: String(body.title || '').trim() || null,
        patientName: String(body.patientName || '').trim() || null,
        patientPhone: String(body.patientPhone || '').trim() || null,
        followUpDate: body.followUpDate ? parseIsoDateOnly(body.followUpDate) : null,
        followUpNotes: String(body.followUpNotes || '').trim() || null,
        details: String(body.details || '').trim() || null,
        createdByAdminId: auth.session.userId,
      },
    });
    return NextResponse.json({ item: mapRow(row) }, { status: 201 });
  } catch (e) {
    return prismaRouteError(e, 'pasteur-work-reports POST');
  }
}

type PutBody = PostBody & { id?: string };

export async function PATCH(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const body = await parseJson<PutBody>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  const id = String(body.id || '').trim();
  if (!id) return jsonError('شناسه الزامی است.');

  try {
    const row = await prisma.pasteurWorkReport.update({
      where: { id },
      data: {
        title: body.title !== undefined ? String(body.title || '').trim() || null : undefined,
        patientName:
          body.patientName !== undefined ? String(body.patientName || '').trim() || null : undefined,
        patientPhone:
          body.patientPhone !== undefined ? String(body.patientPhone || '').trim() || null : undefined,
        followUpDate:
          body.followUpDate !== undefined
            ? body.followUpDate
              ? parseIsoDateOnly(body.followUpDate)
              : null
            : undefined,
        followUpNotes:
          body.followUpNotes !== undefined ? String(body.followUpNotes || '').trim() || null : undefined,
        details: body.details !== undefined ? String(body.details || '').trim() || null : undefined,
      },
    });
    return NextResponse.json({ item: mapRow(row) });
  } catch (e) {
    return prismaRouteError(e, 'pasteur-work-reports PUT');
  }
}
