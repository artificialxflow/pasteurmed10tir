import { jsonError } from '@/lib/auth/api-utils';
import { getPaymentIntentResult } from '@/lib/commerce/zibal-intent-service';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) return jsonError('شناسه نامعتبر است.');

  const result = await getPaymentIntentResult(id);
  if (!result) return jsonError('تراکنش یافت نشد.', 404);

  return NextResponse.json(result);
}
