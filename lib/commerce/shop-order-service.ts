import { generateCommerceId, mapShopOrder } from '@/lib/commerce/mappers';
import { isShopVip } from '@/lib/commerce/wallet-service';
import { optionalPatient } from '@/lib/operations/require-patient';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';

export type ShopOrderItemInput = {
  id?: string | number;
  name?: string;
  category?: string;
  qty?: number;
  unitPrice?: number;
  finalUnitPrice?: number;
};

export type CreateShopOrderInput = {
  customerName: string;
  customerPhone: string;
  address: string;
  customerType?: string;
  items: ShopOrderItemInput[];
  subtotal: number;
  discount: number;
  total: number;
  status?: 'pending' | 'confirmed';
};

export async function createShopOrderRecord(input: CreateShopOrderInput) {
  const customerPhone = normalizePhoneDigits(input.customerPhone);
  const customerName = String(input.customerName || '').trim();
  const address = String(input.address || '').trim();
  const items = Array.isArray(input.items) ? input.items : [];

  if (!customerPhone || !customerName || !address || !items.length) {
    throw new Error('اطلاعات سفارش ناقص است.');
  }

  const session = await optionalPatient();
  const vip = (await isShopVip(customerPhone)) || input.customerType === 'vip';
  const customerType = vip ? 'vip' : 'regular';

  for (const item of items) {
    const productId = Number(item.id);
    const qty = Number(item.qty || 0);
    if (!Number.isFinite(productId) || qty <= 0) continue;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) continue;
    if (product.stock < qty) {
      throw new Error(`موجودی «${item.name || product.name}» کافی نیست.`);
    }
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
      subtotal: Number(input.subtotal || 0),
      discount: Number(input.discount || 0),
      total: Number(input.total || 0),
      status: input.status === 'confirmed' ? 'confirmed' : 'pending',
    },
  });

  return mapShopOrder(row);
}
