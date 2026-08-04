import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapVisitor } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { PASTEUR_DATA } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import type { VisitorStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('visitors');
  if (auth.error) return auth.error;

  const rows = await prisma.visitor.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json({ items: rows.map(mapVisitor) });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('visitors');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: Array<Record<string, unknown>>; reset?: boolean }>(
    request,
  );
  if (!body) return jsonError('درخواست نامعتبر است.');

  const source = body.reset
    ? PASTEUR_DATA.visitors
    : Array.isArray(body.items)
      ? body.items
      : null;
  if (!source) return jsonError('لیست ویزیتورها الزامی است.');

  const cleaned = source.map((v, index) => ({
    id: Number(v.id ?? index + 1),
    name: String(v.name || ''),
    code: String(v.code || '').trim().toUpperCase(),
    commissionRate: Number(v.commissionRate || 0),
    phone: String(v.phone || ''),
    status: (String(v.status || 'active') === 'inactive' ? 'inactive' : 'active') as VisitorStatus,
  }));

  const keepIds = cleaned.map((v) => v.id);

  await prisma.$transaction(async (tx) => {
    for (const item of cleaned) {
      await tx.visitor.upsert({
        where: { id: item.id },
        create: item,
        update: {
          name: item.name,
          code: item.code,
          commissionRate: item.commissionRate,
          phone: item.phone,
          status: item.status,
        },
      });
    }
    await tx.visitor.deleteMany({ where: { id: { notIn: keepIds } } });
  });

  const rows = await prisma.visitor.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json({ items: rows.map(mapVisitor) });
}
