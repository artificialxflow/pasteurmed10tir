/**
 * Zohal inquiry API client.
 * Env: ZOHAL_TOKEN, ZOHAL_BASE_URL (default https://service.zohal.io/api/v0/services)
 *
 * Credit scoring is OTP-based:
 *   POST inquiry/credit_inquiry/send_otp
 *   POST inquiry/credit_inquiry/verify_otp
 *   GET  inquiry/credit_inquiry/result/{reference_id}
 */

import { isRetryablePathError } from '@/lib/zohal/errors';

export type ZohalResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; data?: unknown };

/**
 * مسیرهای جایگزین اعتبارسنجی. مسیر اول رسمی است؛ بقیه فقط وقتی امتحان
 * می‌شوند که مسیر اول ۴۰۴ بدهد (یعنی زحل آدرس را عوض کرده باشد).
 */
const CREDIT_SEND_OTP_PATHS = [
  'inquiry/credit_inquiry/send_otp',
  'inquiry/credit_scoring/send_otp',
  'inquiry/credit/send_otp',
];

const CREDIT_VERIFY_OTP_PATHS = [
  'inquiry/credit_inquiry/verify_otp',
  'inquiry/credit_scoring/verify_otp',
  'inquiry/credit/verify_otp',
];

const CREDIT_RESULT_PREFIXES = [
  'inquiry/credit_inquiry/result',
  'inquiry/credit_scoring/result',
  'inquiry/credit/result',
];

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
    const trimmed = text.trim();

    // verify_otp may return empty 200
    if (!trimmed) {
      if (!res.ok) {
        console.error('[zohal] http error', path, res.status, '(empty body)');
        return { ok: false, error: `خطای زحل (${res.status})` };
      }
      return { ok: true, data: { ok: true } };
    }

    // Gateways / WAF / wrong base URL often return HTML login or error pages.
    if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
      console.error('[zohal] non-json html', path, res.status, trimmed.slice(0, 120));
      return {
        ok: false,
        error:
          res.status === 401 || res.status === 403
            ? 'توکن زحل معتبر نیست یا به این سرویس دسترسی ندارد.'
            : `پاسخ نامعتبر از زحل (HTML، وضعیت ${res.status}). ZOHAL_BASE_URL و ZOHAL_TOKEN را بررسی کنید.`,
      };
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(trimmed) as Record<string, unknown>;
    } catch (parseErr) {
      console.error('[zohal] non-json body', path, res.status, parseErr, trimmed.slice(0, 120));
      return {
        ok: false,
        error: `پاسخ نامعتبر از زحل (وضعیت ${res.status}).`,
      };
    }

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

/**
 * چند مسیر را به ترتیب امتحان می‌کند و روی اولین موفق می‌ایستد.
 * فقط وقتی جلو می‌رود که خطا از جنس «مسیر پیدا نشد» باشد؛ خطاهای واقعی
 * مثل `SERVICE_DISABLED` بلافاصله برمی‌گردند و درخواست بیهوده زده نمی‌شود.
 */
async function callZohalFirstOk(
  paths: string[],
  init?: { method?: 'GET' | 'POST'; body?: Record<string, unknown> },
): Promise<ZohalResult> {
  let last: ZohalResult = { ok: false, error: 'مسیر زحل یافت نشد.' };
  for (const path of paths) {
    const result = await callZohal(path, init);
    if (result.ok) return result;
    last = result;
    if (!isRetryablePathError(last.error)) return last;
  }
  return last;
}

async function callInquiryFirstOk(
  methods: string[],
  payload: Record<string, unknown>,
): Promise<ZohalResult> {
  return callZohalFirstOk(
    methods.map((method) => `inquiry/${method}`),
    { method: 'POST', body: payload },
  );
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
  return callZohalFirstOk(CREDIT_SEND_OTP_PATHS, {
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
  return callZohalFirstOk(CREDIT_VERIFY_OTP_PATHS, {
    method: 'POST',
    body: {
      otp,
      reference_id: referenceId,
    },
  });
}

export async function zohalCreditGetResult(referenceId: string): Promise<ZohalResult> {
  const ref = encodeURIComponent(referenceId);
  return callZohalFirstOk(
    CREDIT_RESULT_PREFIXES.map((prefix) => `${prefix}/${ref}`),
    { method: 'GET' },
  );
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
