import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapVisitor } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { PASTEUR_DATA } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import type { VisitorRole, VisitorStatus } from '@prisma/client';
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

  const cleaned = source.map((v, index) => {
    const raw = v as Record<string, unknown>;
    const role: VisitorRole =
      String(raw.role || 'visitor') === 'referrer' ? 'referrer' : 'visitor';
    const referralRate = Number(raw.commissionRate ?? 0);
    const clinical = Number(
      raw.commissionRateClinical ?? (role === 'referrer' ? referralRate : raw.commissionRate ?? 0),
    );
    const shop = Number(
      raw.commissionRateShop ?? (role === 'referrer' ? referralRate : clinical),
    );
    const commissionRate = role === 'referrer' ? referralRate : clinical;
    return {
      id: Number(raw.id ?? index + 1),
      name: String(raw.name || ''),
      code: String(raw.code || '').trim().toUpperCase(),
      role,
      commissionRate,
      commissionRateClinical: role === 'referrer' ? null : clinical,
      commissionRateShop: role === 'referrer' ? null : shop,
      phone: String(raw.phone || ''),
      status: (String(raw.status || 'active') === 'inactive' ? 'inactive' : 'active') as VisitorStatus,
    };
  });

  const keepIds = cleaned.map((v) => v.id);

  await prisma.$transaction(async (tx) => {
    for (const item of cleaned) {
      await tx.visitor.upsert({
        where: { id: item.id },
        create: item,
        update: {
          name: item.name,
          code: item.code,
          role: item.role,
          commissionRate: item.commissionRate,
          commissionRateClinical: item.commissionRateClinical,
          commissionRateShop: item.commissionRateShop,
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
