/**
 * Zohal inquiry API client.
 * Env: ZOHAL_TOKEN, ZOHAL_BASE_URL (default https://service.zohal.io/api/v0/services)
 */

export type ZohalResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; data?: unknown };

function baseUrl(): string {
  return (process.env.ZOHAL_BASE_URL || 'https://service.zohal.io/api/v0/services').replace(
    /\/$/,
    '',
  );
}

export function isZohalConfigured(): boolean {
  return Boolean(process.env.ZOHAL_TOKEN?.trim());
}

async function callInquiry(
  method: string,
  payload: Record<string, unknown>,
): Promise<ZohalResult> {
  const token = process.env.ZOHAL_TOKEN?.trim();
  if (!token) return { ok: false, error: 'توکن زحل تنظیم نشده است.' };

  const url = `${baseUrl()}/inquiry/${method}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      console.error('[zohal] http error', method, res.status, data);
      return {
        ok: false,
        error: String(data.message || data.error || `خطای زحل (${res.status})`),
        data,
      };
    }
    return { ok: true, data };
  } catch (e) {
    console.error('[zohal] network', method, e);
    return { ok: false, error: 'خطا در ارتباط با سرویس زحل.' };
  }
}

export async function zohalShahkar(nationalCode: string, mobile: string): Promise<ZohalResult> {
  return callInquiry('shahkar', {
    national_code: nationalCode,
    mobile,
  });
}

export async function zohalNationalIdentity(nationalCode: string): Promise<ZohalResult> {
  return callInquiry('national_identity_inquiry', {
    national_code: nationalCode,
  });
}

/** Method name may vary in panel — try common slug */
export async function zohalCreditInquiry(nationalCode: string): Promise<ZohalResult> {
  return callInquiry('credit_inquiry', {
    national_code: nationalCode,
  });
}

export async function zohalBouncedCheque(nationalCode: string): Promise<ZohalResult> {
  return callInquiry('bounced_cheque', {
    national_code: nationalCode,
  });
}

export function shahkarMatched(data: unknown): boolean | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  const body = (root.response_body || root.data || root) as Record<string, unknown>;
  if (typeof body.matched === 'boolean') return body.matched;
  if (body.data && typeof body.data === 'object') {
    const inner = body.data as Record<string, unknown>;
    if (typeof inner.matched === 'boolean') return inner.matched;
  }
  if (typeof root.result === 'boolean') return root.result;
  return null;
}
