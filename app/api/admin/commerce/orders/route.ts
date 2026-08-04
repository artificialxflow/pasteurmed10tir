import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapShopOrder } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import type { ShopOrderStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

const STATUS: ShopOrderStatus[] = ['pending', 'confirmed', 'shipped', 'cancelled'];

export async function GET() {
  const auth = await requireAdmin('shop');
  if (auth.error) return auth.error;

  const rows = await prisma.shopOrder.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items: rows.map(mapShopOrder) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('shop');
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string; status?: string }>(request);
  if (!body?.id) return jsonError('شناسه سفارش الزامی است.');
  if (!body.status || !STATUS.includes(body.status as ShopOrderStatus)) {
    return jsonError('وضعیت نامعتبر است.');
  }

  const row = await prisma.shopOrder.update({
    where: { id: body.id },
    data: { status: body.status as ShopOrderStatus },
  });
  return NextResponse.json({ order: mapShopOrder(row) });
}
