/**
 * Zohal inquiry API client.
 * Env: ZOHAL_TOKEN, ZOHAL_BASE_URL (default https://service.zohal.io/api/v0/services)
 *
 * Credit scoring is OTP-based:
 *   POST inquiry/credit_inquiry/send_otp
 *   POST inquiry/credit_inquiry/verify_otp
 *   GET  inquiry/credit_inquiry/result/{reference_id}
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
  // Official Zohal success often uses result: 1
  if (data.result === 1 || data.result === '1' || data.result === true) {
    return null;
  }
  if (data.result === 0 || data.result === '0' || data.result === false) {
    const body = data.response_body;
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const nested = body as Record<string, unknown>;
      return String(nested.message || nested.error || data.message || 'استعلام ناموفق');
    }
    return String(data.message || data.error || 'استعلام ناموفق');
  }

  if (data.success === false || data.ok === false) {
    return String(data.message || data.error || 'استعلام ناموفق');
  }

  const resultCode = data.result_code ?? data.resultCode ?? data.code;
  if (typeof resultCode === 'number' && resultCode !== 0 && resultCode !== 200 && resultCode !== 1) {
    return String(data.message || data.error || `کد نتیجه ${resultCode}`);
  }
  if (
    typeof resultCode === 'string' &&
    resultCode.trim() &&
    !['0', '1', '200', 'ok', 'OK', 'success', 'SUCCESS'].includes(resultCode.trim())
  ) {
    return String(data.message || data.error || `کد نتیجه ${resultCode}`);
  }

  const body = data.response_body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const nested = body as Record<string, unknown>;
    if (nested.error_code != null && String(nested.error_code).trim()) {
      return String(nested.message || nested.error_code);
    }
    if (nested.success === false || nested.ok === false) {
      return String(nested.message || nested.error || 'استعلام ناموفق');
    }
    if (nested.error != null && String(nested.error).trim() && nested.error_code !== null) {
      return String(nested.error);
    }
  }

  return null;
}

async function callZohal(
  path: string,
  init?: { method?: 'GET' | 'POST'; body?: Record<string, unknown> },
): Promise<ZohalResult> {
  const token = process.env.ZOHAL_TOKEN?.trim();
  if (!token) return { ok: false, error: 'توکن زحل تنظیم نشده است.' };

  const method = init?.method || 'POST';
  const url = `${baseUrl()}/${path.replace(/^\//, '')}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: method === 'POST' ? JSON.stringify(init?.body || {}) : undefined,
      cache: 'no-store',
    });

    const text = await res.text();
    const data = (text ? (JSON.parse(text) as Record<string, unknown>) : {}) as Record<
      string,
      unknown
    >;

    if (!res.ok) {
      console.error('[zohal] http error', path, res.status, data);
      return {
        ok: false,
        error: String(
          (data.response_body as { message?: string } | undefined)?.message ||
            data.message ||
            data.error ||
            `خطای زحل (${res.status})`,
        ),
        data,
      };
    }

    // verify_otp may return empty 200
    if (!text) return { ok: true, data: { ok: true } };

    const businessError = extractZohalBusinessError(data);
    if (businessError) {
      console.error('[zohal] business error', path, businessError);
      return { ok: false, error: businessError, data };
    }

    return { ok: true, data };
  } catch (e) {
    console.error('[zohal] network', path, e);
    return { ok: false, error: 'خطا در ارتباط با سرویس زحل.' };
  }
}

async function callInquiry(
  method: string,
  payload: Record<string, unknown>,
): Promise<ZohalResult> {
  return callZohal(`inquiry/${method}`, { method: 'POST', body: payload });
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

/** Iranian nationals → nationality_type: 1 (official Zohal bounced_cheque API). */
export async function zohalBouncedCheque(nationalCode: string): Promise<ZohalResult> {
  return callInquiry('bounced_cheque', {
    national_code: nationalCode,
    nationality_type: 1,
  });
}

export async function zohalCreditSendOtp(
  nationalCode: string,
  mobile: string,
): Promise<ZohalResult> {
  return callZohal('inquiry/credit_inquiry/send_otp', {
    method: 'POST',
    body: {
      national_code: nationalCode,
      mobile,
    },
  });
}

export async function zohalCreditVerifyOtp(
  otp: string,
  referenceId: string,
): Promise<ZohalResult> {
  return callZohal('inquiry/credit_inquiry/verify_otp', {
    method: 'POST',
    body: {
      otp,
      reference_id: referenceId,
    },
  });
}

export async function zohalCreditGetResult(referenceId: string): Promise<ZohalResult> {
  return callZohal(`inquiry/credit_inquiry/result/${encodeURIComponent(referenceId)}`, {
    method: 'GET',
  });
}

export function extractCreditReferenceId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  if (typeof root.reference_id === 'string' && root.reference_id.trim()) {
    return root.reference_id.trim();
  }
  const body = root.response_body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const nested = body as Record<string, unknown>;
    if (typeof nested.reference_id === 'string' && nested.reference_id.trim()) {
      return nested.reference_id.trim();
    }
    const inner = nested.data;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const d = inner as Record<string, unknown>;
      if (typeof d.reference_id === 'string' && d.reference_id.trim()) {
        return d.reference_id.trim();
      }
    }
  }
  return null;
}

export function isCreditResultCompleted(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const root = data as Record<string, unknown>;
  const body = root.response_body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const nested = body as Record<string, unknown>;
    const inner = nested.data;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const d = inner as Record<string, unknown>;
      if (d.status === 'completed') return true;
      if (d.result && typeof d.result === 'object') return true;
    }
  }
  return false;
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

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
