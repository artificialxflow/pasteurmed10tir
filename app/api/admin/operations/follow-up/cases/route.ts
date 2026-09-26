import { jsonError, parseJson } from '@/lib/auth/api-utils';
import {
  buildFollowUpWhere,
  parseCreateFollowUpBody,
  parseFollowUpTab,
} from '@/lib/admin/follow-up-service';
import { requireAdmin } from '@/lib/content/require-admin';
import { mapFollowUpCase } from '@/lib/follow-up/mappers';
import { parseIsoDateOnly } from '@/lib/follow-up/types';
import { generateOperationId } from '@/lib/operations/mappers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const tab = parseFollowUpTab(searchParams.get('tab'));
  const where = buildFollowUpWhere(tab, {
    followUpDate: searchParams.get('followUpDate') ?? undefined,
    serviceCategory: searchParams.get('serviceCategory') ?? undefined,
    search: searchParams.get('q') ?? undefined,
  });

  const rows = await prisma.followUpCase.findMany({
    where,
    orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
    take: tab === 'satisfaction' ? 2000 : 500,
  });

  return NextResponse.json({ items: rows.map(mapFollowUpCase), tab });
}

export async function POST(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  try {
    const data = parseCreateFollowUpBody(body);
    const row = await prisma.followUpCase.create({
      data: {
        id: generateOperationId(),
        ...data,
        createdByAdminId: auth.session.userId,
      },
    });
    return NextResponse.json({ item: mapFollowUpCase(row) }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'خطا در ثبت.');
  }
}

type PatchBody = {
  id?: string;
  appointmentGiven?: boolean;
  followUpDone?: boolean;
  followUpDate?: string;
};

export async function PATCH(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const body = await parseJson<PatchBody>(request);
  if (!body?.id) return jsonError('شناسه الزامی است.');

  const existing = await prisma.followUpCase.findUnique({ where: { id: body.id } });
  if (!existing) return jsonError('مورد یافت نشد.', 404);

  const followUpDate =
    body.followUpDate !== undefined ? parseIsoDateOnly(body.followUpDate) : undefined;

  const row = await prisma.followUpCase.update({
    where: { id: body.id },
    data: {
      ...(body.appointmentGiven !== undefined ? { appointmentGiven: body.appointmentGiven } : {}),
      ...(body.followUpDone !== undefined ? { followUpDone: body.followUpDone } : {}),
      ...(followUpDate !== undefined ? { followUpDate } : {}),
    },
  });

  return NextResponse.json({ item: mapFollowUpCase(row) });
}
