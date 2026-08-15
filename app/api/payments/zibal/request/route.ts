import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { createZibalPaymentIntent } from '@/lib/commerce/zibal-intent-service';
import type { PendingPayment } from '@/lib/payment';
import { isZibalConfigured } from '@/lib/zibal/config';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!isZibalConfigured()) {
    return jsonError('درگاه پرداخت پیکربندی نشده است.', 503);
  }

  const body = await parseJson<{
    pending?: PendingPayment;
    basePath?: string;
  }>(request);
  if (!body?.pending) return jsonError('درخواست نامعتبر است.');

  const basePath = String(body.basePath || '/dental').replace(/\\/g, '/');
  const amount = Number(body.pending.amount || body.pending.amountToman || 0);
  if (amount < 100) return jsonError('مبلغ پرداخت نامعتبر است.');

  try {
    const result = await createZibalPaymentIntent({
      pending: body.pending,
      basePath,
    });
    return NextResponse.json(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'خطا در ایجاد تراکنش.', 502);
  }
}
