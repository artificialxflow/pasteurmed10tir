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

const ZIBAL_FETCH_TIMEOUT_MS = 20_000;

function friendlyZibalMessage(raw: string, result?: number): string {
  const text = String(raw || '').trim();
  const lower = text.toLowerCase();

  if (/invalid ip/i.test(text) || result === 107) {
    return 'درگاه پرداخت موقتاً در دسترس نیست (IP سرور در پنل زیبال ثبت نشده). چند دقیقه دیگر تلاش کنید یا با پشتیبانی pasteur.plus تماس بگیرید.';
  }
  if (/callback/i.test(lower) || result === 105) {
    return 'آدرس بازگشت پرداخت نامعتبر است. SITE_URL / دامنه ثبت‌شده در زیبال را بررسی کنید.';
  }
  if (/merchant/i.test(lower) || result === 102 || result === 103) {
    return 'شناسه درگاه پرداخت نامعتبر است. ZIBAL_MERCHANT_ID را بررسی کنید.';
  }
  if (/amount/i.test(lower) || result === 104) {
    return 'مبلغ پرداخت برای درگاه نامعتبر است.';
  }
  return text || 'ایجاد تراکنش در زیبال ناموفق بود.';
}

async function postZibal<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ZIBAL_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${ZIBAL_GATEWAY_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: controller.signal,
    });

    const text = await res.text();
    const trimmed = text.trim();

    if (!trimmed) {
      console.error('[zibal] empty response', path, res.status);
      throw new Error('پاسخ خالی از درگاه زیبال.');
    }

    if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
      console.error('[zibal] html response', path, res.status, trimmed.slice(0, 120));
      throw new Error(`پاسخ نامعتبر از درگاه زیبال (HTML، وضعیت ${res.status}).`);
    }

    let data: T;
    try {
      data = JSON.parse(trimmed) as T;
    } catch {
      console.error('[zibal] non-json response', path, res.status, trimmed.slice(0, 120));
      throw new Error('پاسخ نامعتبر از درگاه زیبال.');
    }

    if (!res.ok) {
      console.error('[zibal] http error', path, res.status, data);
      throw new Error(`خطا در ارتباط با درگاه زیبال (${res.status}).`);
    }

    return data;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.error('[zibal] timeout', path, ZIBAL_FETCH_TIMEOUT_MS);
      throw new Error('زمان اتصال به درگاه زیبال به پایان رسید. دوباره تلاش کنید.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
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

  const callbackUrl = getZibalCallbackUrl();
  console.info('[zibal] request', {
    amountRial: input.amountRial,
    orderId: input.orderId,
    callbackUrl,
    merchant: merchant === 'zibal' ? 'zibal(sandbox)' : `${merchant.slice(0, 6)}…`,
  });

  const data = await postZibal<ZibalRequestResult>('v1/request', {
    merchant,
    amount: input.amountRial,
    callbackUrl,
    description: input.description,
    orderId: input.orderId,
    ...(input.mobile ? { mobile: input.mobile } : {}),
  });

  if (data.result !== 100 || !data.trackId) {
    const raw = data.message || 'ایجاد تراکنش در زیبال ناموفق بود.';
    console.error('[zibal] request rejected', { result: data.result, message: raw });
    throw new ZibalError(friendlyZibalMessage(raw, data.result), data.result);
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
