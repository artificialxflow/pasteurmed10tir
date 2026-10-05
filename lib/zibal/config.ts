export function getZibalMerchantId(): string {
  const sandbox = process.env.ZIBAL_SANDBOX === 'true';
  if (sandbox) return 'zibal';
  return (process.env.ZIBAL_MERCHANT_ID || '').trim();
}

export function isZibalConfigured(): boolean {
  return Boolean(getZibalMerchantId());
}

export function getSiteUrl(): string {
  const url = (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).trim();
  return url.replace(/\/$/, '');
}

/** Callback must be absolute https in production; Zibal rejects mismatched domains. */
export function assertZibalCallbackUrl(): string {
  const callbackUrl = getZibalCallbackUrl();
  const site = getSiteUrl();
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && (!/^https:\/\//i.test(site) || /localhost|127\.0\.0\.1/i.test(site))) {
    throw new Error(
      'آدرس سایت برای پرداخت تنظیم نشده است. SITE_URL یا NEXT_PUBLIC_SITE_URL را روی دامنه https عمومی بگذارید.',
    );
  }

  if (!URL.canParse(callbackUrl)) {
    throw new Error('آدرس بازگشت درگاه پرداخت نامعتبر است.');
  }

  return callbackUrl;
}

export function getZibalCallbackUrl(): string {
  return `${getSiteUrl()}/api/payments/zibal/callback`;
}

export const ZIBAL_GATEWAY_BASE = 'https://gateway.zibal.ir';

export function getZibalStartUrl(trackId: number | string): string {
  return `${ZIBAL_GATEWAY_BASE}/start/${trackId}`;
}
