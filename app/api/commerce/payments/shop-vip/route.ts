import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { completeShopVipPayment } from '@/lib/commerce/payment-service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await parseJson<{
    patientName?: string;
    patientPhone?: string;
    planName?: string;
    amount?: number;
    referralCode?: string;
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  try {
    const result = await completeShopVipPayment(body);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'خطا در فعال‌سازی VIP.');
  }
}
