/** sessionStorage key for visitor referral from ?ref= */
export const REFERRAL_STORAGE_KEY = 'pasteur_visitor_ref';

export function normalizeReferralCode(raw: string | null | undefined): string {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 32);
}

/** Persist ?ref=CODE from current URL (browser only). */
export function captureReferralRefFromLocation(search?: string): string | null {
  if (typeof window === 'undefined') return null;
  const q = search ?? window.location.search;
  const params = new URLSearchParams(q.startsWith('?') ? q : `?${q}`);
  const code = normalizeReferralCode(params.get('ref'));
  if (!code) return null;
  try {
    sessionStorage.setItem(REFERRAL_STORAGE_KEY, code);
  } catch {
    /* private mode */
  }
  return code;
}

export function readStoredReferralCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    return normalizeReferralCode(sessionStorage.getItem(REFERRAL_STORAGE_KEY));
  } catch {
    return '';
  }
}

/** Public landing URL used on visitor QR cards. */
export function visitorRefPath(code: string): string {
  const c = normalizeReferralCode(code);
  return c ? `/?ref=${encodeURIComponent(c)}` : '/';
}

export function visitorRefAppPath(code: string): string {
  const c = normalizeReferralCode(code);
  return c ? `/app?ref=${encodeURIComponent(c)}` : '/app';
}
