import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { generateOperationId } from '@/lib/operations/mappers';
import { prisma } from '@/lib/prisma';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('specialistReferrals');
  if (auth.error) return auth.error;
  try {
    const items = await prisma.emergencyPhysician.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ items });
  } catch (e) {
    return prismaRouteError(e, 'admin/emergency-physicians GET');
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin('specialistReferrals');
  if (auth.error) return auth.error;
  const body = await parseJson<{ name?: string; sortOrder?: number }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');
  const name = String(body.name || '').trim();
  if (name.length < 2) return jsonError('نام پزشک الزامی است.');
  try {
    const item = await prisma.emergencyPhysician.create({
      data: {
        id: generateOperationId(),
        name,
        sortOrder: Number(body.sortOrder) || 0,
        active: true,
      },
    });
    return NextResponse.json({ item });
  } catch (e) {
    return prismaRouteError(e, 'admin/emergency-physicians POST');
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('specialistReferrals');
  if (auth.error) return auth.error;
  const body = await parseJson<{
    items?: Array<{ id: string; name: string; active?: boolean; sortOrder?: number }>;
  }>(request);
  if (!body?.items || !Array.isArray(body.items)) return jsonError('لیست نامعتبر است.');
  try {
    for (const row of body.items) {
      await prisma.emergencyPhysician.update({
        where: { id: row.id },
        data: {
          name: String(row.name || '').trim(),
          active: row.active !== false,
          sortOrder: Number(row.sortOrder) || 0,
        },
      });
    }
    const items = await prisma.emergencyPhysician.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ items });
  } catch (e) {
    return prismaRouteError(e, 'admin/emergency-physicians PUT');
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin('specialistReferrals');
  if (auth.error) return auth.error;
  const id = new URL(request.url).searchParams.get('id')?.trim();
  if (!id) return jsonError('شناسه الزامی است.');
  try {
    await prisma.emergencyPhysician.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return prismaRouteError(e, 'admin/emergency-physicians DELETE');
  }
}
