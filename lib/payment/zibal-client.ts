import { PasteurStorage, type Booking } from '@/lib/storage';
import { ShopCart } from '@/lib/shop';
import type { PendingPayment } from '@/lib/payment';

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`خطا (${res.status})`);
    throw new Error('پاسخ خالی از سرور.');
  }
  let data: T & { error?: string };
  try {
    data = JSON.parse(text) as T & { error?: string };
  } catch {
    throw new Error(!res.ok ? `خطا (${res.status})` : 'پاسخ نامعتبر از سرور.');
  }
  if (!res.ok) throw new Error(data.error || 'خطا در درگاه پرداخت.');
  return data as T;
}

export async function startZibalPaymentApi(input: {
  pending: PendingPayment;
  basePath: string;
}): Promise<{ redirectUrl: string; intentId: string; trackId: number }> {
  const res = await fetch('/api/payments/zibal/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJson(res);
}

export async function fetchZibalPaymentResultApi(intentId: string): Promise<{
  status: 'paid' | 'failed' | 'pending';
  payment: PendingPayment & { status?: string; paidAt?: string; failedAt?: string };
}> {
  const res = await fetch(`/api/payments/zibal/result/${encodeURIComponent(intentId)}`);
  return parseJson(res);
}

export function getPaymentIntentIdFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get('pi');
  return value && value.trim() ? value.trim() : null;
}

export function applyPaymentResultToStorage(payment: Record<string, unknown>): void {
  if (payment.status === 'paid') {
    PasteurStorage.setLastPayment(payment);
    PasteurStorage.clearPendingPayment();
    if (payment.planId === 'shop-vip') {
      ShopCart.setCustomerType('vip', String(payment.patientPhone || ''));
    }
    if (payment.kind === 'booking' && payment.booking) {
      PasteurStorage.setSessionLastBooking(payment.booking as Booking);
    }
    return;
  }

  if (payment.status === 'failed') {
    PasteurStorage.setLastPayment(payment);
  }
}
