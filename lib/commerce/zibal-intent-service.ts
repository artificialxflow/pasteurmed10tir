import {
  buildCompletedPaymentPayload,
  buildFailedPaymentPayload,
  buildPaymentDescription,
  completePendingPaymentOnServer,
  pendingAmountToman,
  resolvePaymentPaths,
} from '@/lib/commerce/server-payment-complete';
import { generateCommerceId } from '@/lib/commerce/mappers';
import type { PendingPayment } from '@/lib/payment';
import { prisma } from '@/lib/prisma';
import { getZibalStartUrl, isZibalConfigured } from '@/lib/zibal/config';
import { ZibalError, zibalRequest, zibalVerify } from '@/lib/zibal/client';
import { normalizePhoneDigits } from '@/lib/operations/phone';

function tomanToRial(toman: number): number {
  return Math.round(toman * 10);
}

export async function createZibalPaymentIntent(input: {
  pending: PendingPayment;
  basePath: string;
}) {
  if (!isZibalConfigured()) {
    throw new Error('درگاه پرداخت پیکربندی نشده است (ZIBAL_MERCHANT_ID).');
  }

  const pending = input.pending;
  const amountToman = pendingAmountToman(pending);
  if (amountToman < 100) {
    throw new Error('مبلغ پرداخت نامعتبر است.');
  }

  const amountRial = tomanToRial(amountToman);
  const { successPath, failPath } = resolvePaymentPaths(pending, input.basePath);
  const intentId = generateCommerceId();

  const intent = await prisma.paymentIntent.create({
    data: {
      id: intentId,
      amountRial,
      amountToman,
      status: 'pending',
      payload: pending as object,
      successPath,
      failPath,
      basePath: input.basePath,
    },
  });

  try {
    const request = await zibalRequest({
      amountRial,
      description: buildPaymentDescription(pending),
      orderId: intentId,
      mobile: pending.patientPhone
        ? normalizePhoneDigits(String(pending.patientPhone))
        : undefined,
    });

    await prisma.paymentIntent.update({
      where: { id: intentId },
      data: { trackId: String(request.trackId) },
    });

    return {
      intentId,
      trackId: request.trackId,
      redirectUrl: getZibalStartUrl(request.trackId!),
    };
  } catch (e) {
    await prisma.paymentIntent.update({
      where: { id: intentId },
      data: {
        status: 'failed',
        failureReason: e instanceof Error ? e.message : 'request failed',
      },
    });
    throw e;
  }
}

export async function handleZibalCallback(searchParams: URLSearchParams) {
  const trackId = searchParams.get('trackId');
  const success = searchParams.get('success');

  if (!trackId) {
    throw new Error('trackId یافت نشد.');
  }

  const intent = await prisma.paymentIntent.findUnique({
    where: { trackId },
  });

  if (!intent) {
    throw new Error('تراکنش یافت نشد.');
  }

  const pending = intent.payload as PendingPayment;

  if (intent.status === 'paid') {
    const payment =
      (intent.resultPayload as Record<string, unknown> | null) ||
      buildCompletedPaymentPayload(pending, {
        refNumber: intent.refNumber || undefined,
        trackId: intent.trackId || undefined,
      });
    return {
      redirectPath: appendQuery(intent.successPath, { pi: intent.id }),
      payment,
    };
  }

  if (success !== '1') {
    const failed = buildFailedPaymentPayload(pending, {
      trackId,
      reason: 'پرداخت توسط کاربر لغو شد.',
    });
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: 'failed',
        failureReason: failed.failureReason ? String(failed.failureReason) : null,
        resultPayload: failed as object,
      },
    });
    return {
      redirectPath: appendQuery(intent.failPath, { pi: intent.id }),
      payment: failed,
    };
  }

  try {
    const verified = await zibalVerify(trackId);
    const paidRial = Number(verified.amount || 0);
    if (paidRial > 0 && paidRial !== intent.amountRial) {
      throw new Error('مبلغ پرداخت با سفارش مطابقت ندارد.');
    }

    const backendResult = await completePendingPaymentOnServer(pending);
    const completed = buildCompletedPaymentPayload(pending, {
      refNumber: verified.refNumber,
      trackId,
    });
    if ('booking' in backendResult && backendResult.booking) {
      completed.booking = backendResult.booking;
    }
    if ('order' in backendResult && backendResult.order) {
      completed.orderId = (backendResult.order as { id?: string }).id;
    }

    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: 'paid',
        refNumber: verified.refNumber != null ? String(verified.refNumber) : null,
        paidAt: new Date(),
        resultPayload: completed as object,
      },
    });

    return {
      redirectPath: appendQuery(intent.successPath, { pi: intent.id }),
      payment: completed,
    };
  } catch (e) {
    const message =
      e instanceof ZibalError || e instanceof Error
        ? e.message
        : 'تأیید پرداخت ناموفق بود.';
    const failed = buildFailedPaymentPayload(pending, { trackId, reason: message });
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: 'failed',
        failureReason: message,
        resultPayload: failed as object,
      },
    });
    return {
      redirectPath: appendQuery(intent.failPath, { pi: intent.id }),
      payment: failed,
    };
  }
}

export async function getPaymentIntentResult(intentId: string) {
  const intent = await prisma.paymentIntent.findUnique({ where: { id: intentId } });
  if (!intent) return null;

  const pending = intent.payload as PendingPayment;

  if (intent.status === 'paid') {
    const payment =
      (intent.resultPayload as Record<string, unknown> | null) ||
      buildCompletedPaymentPayload(pending, {
        refNumber: intent.refNumber || undefined,
        trackId: intent.trackId || undefined,
      });
    return {
      status: 'paid' as const,
      payment,
    };
  }

  if (intent.status === 'failed') {
    const payment =
      (intent.resultPayload as Record<string, unknown> | null) ||
      buildFailedPaymentPayload(pending, {
        trackId: intent.trackId || undefined,
        reason: intent.failureReason || undefined,
      });
    return {
      status: 'failed' as const,
      payment,
    };
  }

  return {
    status: intent.status as 'pending',
    payment: pending,
  };
}

function appendQuery(path: string, params: Record<string, string>): string {
  const [pathname, existingQuery = ''] = path.split('?');
  const q = new URLSearchParams(existingQuery);
  for (const [key, value] of Object.entries(params)) {
    q.set(key, value);
  }
  const query = q.toString();
  return query ? `${pathname}?${query}` : pathname;
}
