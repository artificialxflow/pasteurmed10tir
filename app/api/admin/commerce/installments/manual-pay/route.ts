import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { applyInstallmentPayment } from '@/lib/commerce/installment-service';
import { mapInstallmentPlan } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requireAdmin('installments');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    planId?: string;
    scheduleItemId?: string;
    amount?: number;
    note?: string;
  }>(request);
  if (!body?.planId || !body?.scheduleItemId) {
    return jsonError('planId و scheduleItemId الزامی است.');
  }

  try {
    const plan = await applyInstallmentPayment({
      planId: body.planId,
      scheduleItemId: body.scheduleItemId,
      amount: Number(body.amount || 0),
      method: 'manual',
      note: body.note || 'ثبت دستی توسط ادمین',
    });
    return NextResponse.json({ item: plan ? mapInstallmentPlan(plan) : null });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ثبت ناموفق');
  }
}
