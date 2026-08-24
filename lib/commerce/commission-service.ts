import { prisma } from '@/lib/prisma';
import { generateCommerceId, mapCommission } from '@/lib/commerce/mappers';
import { addReferralClubPoints } from '@/lib/club/service';
import { normalizePhoneDigits } from '@/lib/operations/phone';

export async function findVisitorByCode(code?: string | null) {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) return null;
  return prisma.visitor.findFirst({
    where: { code: { equals: normalized, mode: 'insensitive' }, status: 'active' },
  });
}

export async function createCommission(data: {
  referralCode?: string;
  amount?: number;
  sourceType?: string;
  sourceLabel?: string;
  customerName?: string;
  customerPhone?: string;
}) {
  const visitor = await findVisitorByCode(data.referralCode);
  if (!visitor) return null;

  const sourceType = String(data.sourceType || '');
  const isShop = sourceType === 'shop-vip' || sourceType.startsWith('shop');
  const clinical =
    visitor.commissionRateClinical != null
      ? visitor.commissionRateClinical
      : visitor.commissionRate;
  const shop =
    visitor.commissionRateShop != null ? visitor.commissionRateShop : visitor.commissionRate;
  const rate = isShop ? shop : clinical;

  const baseAmount = Number(data.amount || 0);
  const commissionAmount = Math.round((baseAmount * rate) / 100);

  const row = await prisma.commission.create({
    data: {
      id: generateCommerceId(),
      visitorId: visitor.id,
      visitorName: visitor.name,
      referralCode: visitor.code,
      commissionRate: rate,
      commissionAmount,
      sourceType: data.sourceType || null,
      sourceLabel: data.sourceLabel || null,
      customerName: data.customerName || '—',
      customerPhone: normalizePhoneDigits(data.customerPhone || '') || '—',
      amount: baseAmount,
      status: 'pending',
    },
  });

  await addReferralClubPoints({
    visitorPhone: visitor.phone,
    customerPhone: String(data.customerPhone || ''),
    customerName: data.customerName,
  });

  return mapCommission(row);
}
