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

export function getZibalCallbackUrl(): string {
  return `${getSiteUrl()}/api/payments/zibal/callback`;
}

export const ZIBAL_GATEWAY_BASE = 'https://gateway.zibal.ir';

export function getZibalStartUrl(trackId: number | string): string {
  return `${ZIBAL_GATEWAY_BASE}/start/${trackId}`;
}
