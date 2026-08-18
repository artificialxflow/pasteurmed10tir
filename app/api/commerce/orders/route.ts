import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { createShopOrderRecord } from '@/lib/commerce/shop-order-service';
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

  try {
    const order = await createShopOrderRecord({
      customerName: String(body.customerName || ''),
      customerPhone: String(body.customerPhone || ''),
      address: String(body.address || ''),
      customerType: body.customerType,
      items: Array.isArray(body.items) ? body.items : [],
      subtotal: Number(body.subtotal || 0),
      discount: Number(body.discount || 0),
      total: Number(body.total || 0),
      status: 'pending',
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ثبت سفارش ناموفق.', 400);
  }
}
