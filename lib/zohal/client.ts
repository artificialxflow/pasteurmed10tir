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

function extractZohalBusinessError(data: Record<string, unknown>): string | null {
  if (data.success === false || data.ok === false) {
    return String(data.message || data.error || 'استعلام ناموفق');
  }

  const resultCode = data.result_code ?? data.resultCode ?? data.code;
  if (typeof resultCode === 'number' && resultCode !== 0 && resultCode !== 200) {
    return String(data.message || data.error || `کد نتیجه ${resultCode}`);
  }
  if (
    typeof resultCode === 'string' &&
    resultCode.trim() &&
    !['0', '200', 'ok', 'OK', 'success', 'SUCCESS'].includes(resultCode.trim())
  ) {
    return String(data.message || data.error || `کد نتیجه ${resultCode}`);
  }

  const body = data.response_body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const nested = body as Record<string, unknown>;
    if (nested.success === false || nested.ok === false) {
      return String(nested.message || nested.error || 'استعلام ناموفق');
    }
    if (nested.error != null && String(nested.error).trim()) {
      return String(nested.error);
    }
  }

  return null;
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

    const businessError = extractZohalBusinessError(data);
    if (businessError) {
      console.error('[zohal] business error', method, businessError);
      return { ok: false, error: businessError, data };
    }

    return { ok: true, data };
  } catch (e) {
    console.error('[zohal] network', method, e);
    return { ok: false, error: 'خطا در ارتباط با سرویس زحل.' };
  }
}

async function callInquiryFirstOk(
  methods: string[],
  payload: Record<string, unknown>,
): Promise<ZohalResult> {
  let last: ZohalResult = { ok: false, error: 'متد زحل یافت نشد.' };
  for (const method of methods) {
    const result = await callInquiry(method, payload);
    if (result.ok) return result;
    last = result;
    // 404 / unknown method → try next slug
    const msg = result.error.toLowerCase();
    const retryable =
      msg.includes('404') ||
      msg.includes('not found') ||
      msg.includes('یافت نشد') ||
      msg.includes('unknown') ||
      msg.includes('invalid method') ||
      msg.includes('method not') ||
      msg.includes('وجود ندارد');
    if (!retryable) return result;
  }
  return last;
}

export async function zohalShahkar(nationalCode: string, mobile: string): Promise<ZohalResult> {
  return callInquiryFirstOk(['shahkar'], {
    national_code: nationalCode,
    mobile,
  });
}

export async function zohalNationalIdentity(nationalCode: string): Promise<ZohalResult> {
  return callInquiryFirstOk(
    ['national_identity_inquiry', 'national-identity', 'identity_inquiry'],
    { national_code: nationalCode },
  );
}

export async function zohalCreditInquiry(nationalCode: string): Promise<ZohalResult> {
  return callInquiryFirstOk(
    [
      'credit_inquiry',
      'credit_score_inquiry',
      'credit-scoring',
      'credit_score',
      'person_credit',
      'credit',
    ],
    { national_code: nationalCode },
  );
}

export async function zohalBouncedCheque(nationalCode: string): Promise<ZohalResult> {
  return callInquiryFirstOk(
    [
      'bounced_cheque',
      'bounced_cheques',
      'returned_cheque',
      'cheque_inquiry',
      'bounced-cheques',
      'sayad_cheque_inquiry',
    ],
    { national_code: nationalCode },
  );
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
