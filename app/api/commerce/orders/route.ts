import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateCommerceId, mapShopOrder } from '@/lib/commerce/mappers';
import { isShopVip } from '@/lib/commerce/wallet-service';
import { optionalPatient } from '@/lib/operations/require-patient';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type OrderItem = {
  id?: string | number;
  name?: string;
  category?: string;
  qty?: number;
  unitPrice?: number;
  finalUnitPrice?: number;
};

export async function POST(request: Request) {
  const body = await parseJson<{
    customerName?: string;
    customerPhone?: string;
    address?: string;
    customerType?: string;
    items?: OrderItem[];
    subtotal?: number;
    discount?: number;
    total?: number;
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const customerPhone = normalizePhoneDigits(String(body.customerPhone || ''));
  const customerName = String(body.customerName || '').trim();
  const address = String(body.address || '').trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!customerPhone || !customerName || !address || !items.length) {
    return jsonError('اطلاعات سفارش ناقص است.');
  }

  const session = await optionalPatient();
  const vip = (await isShopVip(customerPhone)) || body.customerType === 'vip';
  const customerType = vip ? 'vip' : 'regular';

  // Decrease product stock best-effort
  for (const item of items) {
    const productId = Number(item.id);
    const qty = Number(item.qty || 0);
    if (!Number.isFinite(productId) || qty <= 0) continue;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) continue;
    await prisma.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, product.stock - qty) },
    });
  }

  const row = await prisma.shopOrder.create({
    data: {
      id: generateCommerceId(),
      userId:
        session && session.phone === customerPhone ? session.userId : undefined,
      customerType,
      customerTypeLabel: customerType === 'vip' ? 'VIP تجهیزات' : 'عادی',
      customerName,
      customerPhone,
      address,
      items,
      subtotal: Number(body.subtotal || 0),
      discount: Number(body.discount || 0),
      total: Number(body.total || 0),
      status: 'pending',
    },
  });

  return NextResponse.json({ order: mapShopOrder(row) }, { status: 201 });
}
