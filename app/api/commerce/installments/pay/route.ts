import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { createZibalPaymentIntent } from '@/lib/commerce/zibal-intent-service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { isZibalConfigured } from '@/lib/zibal/config';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  if (!isZibalConfigured()) {
    return jsonError('درگاه پرداخت پیکربندی نشده است.', 503);
  }

  const body = await parseJson<{
    planId?: string;
    scheduleItemId?: string;
    basePath?: string;
  }>(request);
  if (!body?.planId || !body?.scheduleItemId) {
    return jsonError('planId و scheduleItemId الزامی است.');
  }

  const phone = normalizePhoneDigits(auth.session.phone);
  const plan = await prisma.installmentPlan.findUnique({
    where: { id: body.planId },
    include: { scheduleItems: true },
  });
  if (!plan || plan.phone !== phone) {
    return jsonError('طرح اقساط یافت نشد.', 404);
  }

  const item = plan.scheduleItems.find((s) => s.id === body.scheduleItemId);
  if (!item) return jsonError('قسط یافت نشد.', 404);
  if (item.paidAmount >= item.amount) {
    return jsonError('این قسط قبلاً پرداخت شده است.');
  }

  const amount = item.amount - item.paidAmount;
  const app = String(body.basePath || '').includes('/app');
  const successTo = app ? '/app/installments?paid=1' : '/installments?paid=1';
  const basePath = app ? '/app/installments' : '/installments';

  try {
    const result = await createZibalPaymentIntent({
      pending: {
        kind: 'installment',
        planId: plan.id,
        scheduleItemId: item.id,
        installmentIndex: item.index,
        amount,
        amountToman: amount,
        patientName: plan.patientName || '',
        patientPhone: phone,
        successTo,
        title: plan.title,
      },
      basePath,
    });
    return NextResponse.json(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'خطا در ایجاد تراکنش.', 502);
  }
}
