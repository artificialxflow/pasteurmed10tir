import {
  getZibalCallbackUrl,
  getZibalMerchantId,
  ZIBAL_GATEWAY_BASE,
} from '@/lib/zibal/config';

export type ZibalRequestResult = {
  result: number;
  trackId?: number;
  message?: string;
};

export type ZibalVerifyResult = {
  result: number;
  status?: number;
  amount?: number;
  refNumber?: string | number;
  paidAt?: string;
  message?: string;
  cardNumber?: string;
};

export class ZibalError extends Error {
  result: number;

  constructor(message: string, result: number) {
    super(message);
    this.name = 'ZibalError';
    this.result = result;
  }
}

async function postZibal<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${ZIBAL_GATEWAY_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error('پاسخ نامعتبر از درگاه زیبال.');
  }

  if (!res.ok) {
    throw new Error('خطا در ارتباط با درگاه زیبال.');
  }

  return data;
}

export async function zibalRequest(input: {
  amountRial: number;
  description: string;
  orderId: string;
  mobile?: string;
}): Promise<ZibalRequestResult> {
  const merchant = getZibalMerchantId();
  if (!merchant) {
    throw new Error('درگاه پرداخت پیکربندی نشده است.');
  }

  const data = await postZibal<ZibalRequestResult>('v1/request', {
    merchant,
    amount: input.amountRial,
    callbackUrl: getZibalCallbackUrl(),
    description: input.description,
    orderId: input.orderId,
    ...(input.mobile ? { mobile: input.mobile } : {}),
  });

  if (data.result !== 100 || !data.trackId) {
    throw new ZibalError(data.message || 'ایجاد تراکنش در زیبال ناموفق بود.', data.result);
  }

  return data;
}

export async function zibalVerify(trackId: number | string): Promise<ZibalVerifyResult> {
  const merchant = getZibalMerchantId();
  if (!merchant) {
    throw new Error('درگاه پرداخت پیکربندی نشده است.');
  }

  const data = await postZibal<ZibalVerifyResult>('v1/verify', {
    merchant,
    trackId: Number(trackId),
  });

  if (data.result !== 100 || data.status !== 1) {
    throw new ZibalError(data.message || 'تأیید تراکنش ناموفق بود.', data.result);
  }

  return data;
}
