import type { Prisma } from '@prisma/client';
import { isValidNationalId, normalizeNationalId } from '@/lib/validation/national-id';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import {
  extractCreditReferenceId,
  isCreditResultCompleted,
  isZohalConfigured,
  shahkarMatched,
  sleep,
  zohalBouncedCheque,
  zohalCreditGetResult,
  zohalCreditSendOtp,
  zohalCreditVerifyOtp,
  zohalNationalIdentity,
  zohalShahkar,
} from '@/lib/zohal/client';

export type ZohalCreditCheckInput = {
  nationalId: string;
  phone: string;
};

export type ZohalCreditCheckResult = {
  zohalStatus: string;
  zohalPayload: Prisma.InputJsonValue;
  shahkarMatched: boolean | null;
  zohalCheckedAt: Date;
  summary: string;
  referenceId?: string;
};

function truncateError(value: unknown, max = 48): string {
  const text = String(value || 'خطای نامشخص').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function hasServiceError(section: unknown): string | null {
  if (!section || typeof section !== 'object') return null;
  const obj = section as Record<string, unknown>;
  if (obj.error != null && String(obj.error).trim()) return String(obj.error);
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function extractCreditScoreInfo(creditData: unknown): {
  score: number | null;
  risk: string | null;
  description: string | null;
} {
  const root = asRecord(creditData);
  if (!root) return { score: null, risk: null, description: null };
  const body = asRecord(root.response_body) || root;
  const data = asRecord(body.data) || body;
  const result = asRecord(data.result) || data;
  const scoreObj = asRecord(result.score);
  if (!scoreObj) return { score: null, risk: null, description: null };
  const score = Number(scoreObj.score);
  return {
    score: Number.isFinite(score) ? score : null,
    risk: scoreObj.risk ? String(scoreObj.risk) : null,
    description: scoreObj.description ? String(scoreObj.description) : null,
  };
}

export function extractBouncedChequeCount(payload: Record<string, unknown>): number | null {
  const bounced = asRecord(payload.bouncedCheque);
  if (bounced) {
    const body = asRecord(bounced.response_body) || bounced;
    const data = asRecord(body.data);
    if (data && typeof data.count === 'number') return data.count;
  }

  const credit = asRecord(payload.credit);
  if (credit) {
    const body = asRecord(credit.response_body) || credit;
    const data = asRecord(body.data);
    const result = asRecord(data?.result);
    const pichak = asRecord(result?.pichak);
    const cheques = asRecord(pichak?.person_cheques_data);
    if (cheques && typeof cheques.sum_count === 'number') return cheques.sum_count;
    const bouncedInside = asRecord(result?.bounced_cheque);
    if (bouncedInside && bouncedInside.bounced_cheques == null && bouncedInside.status === 404) {
      return 0;
    }
  }
  return null;
}

/** Human-readable multi-line summary for admin tables. */
export function buildZohalCreditSummary(payload: Record<string, unknown>): string {
  const parts: string[] = [];

  if (payload.skipped) {
    return 'زحل: غیرفعال — بررسی دستی';
  }

  const shahkarErr = hasServiceError(payload.shahkar);
  if (shahkarErr) {
    parts.push(`شاهکار: خطا سرویس (${truncateError(shahkarErr)})`);
  } else if (typeof payload.shahkarMatched === 'boolean') {
    parts.push(payload.shahkarMatched ? 'شاهکار: تطبیق' : 'شاهکار: عدم تطبیق');
  } else if (payload.shahkar) {
    parts.push('شاهکار: نتیجه نامشخص');
  }

  const chequeCount = extractBouncedChequeCount(payload);
  const chequeErr = hasServiceError(payload.bouncedCheque);
  if (chequeErr) {
    parts.push(`چک برگشتی: ناموفق (${truncateError(chequeErr)})`);
  } else if (chequeCount != null) {
    parts.push(`چک برگشتی: ${chequeCount.toLocaleString('fa-IR')} مورد`);
  } else if (payload.bouncedCheque) {
    parts.push('چک برگشتی: دریافت شد');
  }

  const creditOtp = asRecord(payload.creditOtp);
  if (creditOtp?.status === 'pending' && creditOtp.reference_id) {
    parts.push('اعتبار: منتظر OTP');
  }

  const creditErr = hasServiceError(payload.credit);
  if (creditErr) {
    parts.push(`اعتبار: ناموفق (${truncateError(creditErr)})`);
  } else if (payload.credit) {
    const scoreInfo = extractCreditScoreInfo(payload.credit);
    if (scoreInfo.score != null) {
      const risk = scoreInfo.risk ? ` / ریسک ${scoreInfo.risk}` : '';
      const desc = scoreInfo.description ? ` — ${scoreInfo.description}` : '';
      parts.push(`اعتبار: امتیاز ${scoreInfo.score.toLocaleString('fa-IR')}${risk}${desc}`);
    } else {
      parts.push('اعتبار: دریافت شد');
    }
  }

  return parts.join('\n') || '—';
}

export function zohalCreditStatusLabel(status?: string | null): string {
  if (status === 'passed') return 'زحل: تأیید کامل';
  if (status === 'partial') return 'زحل: ناقص';
  if (status === 'otp_pending') return 'زحل: منتظر OTP اعتبار';
  if (status === 'failed') return 'زحل: رد شاهکار';
  if (status === 'error') return 'زحل: خطا شاهکار';
  if (status === 'skipped') return 'زحل: —';
  return status ? `زحل: ${status}` : 'زحل: —';
}

export function zohalCreditCheckNotice(status?: string | null): string {
  if (status === 'passed') return 'استعلام کامل شد — شاهکار، چک برگشتی و اعتبار بانکی دریافت شد.';
  if (status === 'partial') {
    return 'شاهکار انجام شد؛ بخش اعتبار یا چک ناقص است (جزئیات در ستون خلاصه).';
  }
  if (status === 'otp_pending') {
    return 'کد OTP اعتبارسنجی برای موبایل بیمار ارسال شد. کد را وارد کنید.';
  }
  if (status === 'failed') return 'شاهکار: کد ملی با موبایل تطبیق ندارد.';
  if (status === 'error') return 'خطا در سرویس شاهکار — جزئیات در ستون خلاصه.';
  if (status === 'skipped') return 'زحل غیرفعال است — بررسی دستی لازم است.';
  return 'استعلام انجام شد.';
}

function resolveZohalStatus(input: {
  shahkarOk: boolean;
  matched: boolean | null;
  creditOk: boolean | null;
  bouncedOk: boolean;
  otpPending?: boolean;
}): string {
  if (!input.shahkarOk) return 'error';
  if (input.matched === false) return 'failed';
  if (input.matched == null) return 'error';
  if (input.otpPending) return 'otp_pending';
  if (input.creditOk === null) {
    return input.bouncedOk ? 'partial' : 'partial';
  }
  if (!input.creditOk || !input.bouncedOk) return 'partial';
  return 'passed';
}

function validateInput(input: ZohalCreditCheckInput):
  | { nationalId: string; phone: string }
  | { error: string; status: number } {
  const nationalId = normalizeNationalId(input.nationalId);
  const phone = normalizePhoneDigits(input.phone);
  if (!nationalId || !isValidNationalId(nationalId)) {
    return { error: 'کد ملی معتبر الزامی است.', status: 400 };
  }
  if (!phone) {
    return { error: 'شماره موبایل الزامی است.', status: 400 };
  }
  return { nationalId, phone };
}

/**
 * Sync base check: شاهکار + چک برگشتی (+ هویت اختیاری).
 * Used on facility submit and as first step before credit OTP.
 */
export async function runZohalBaseCheck(
  input: ZohalCreditCheckInput,
): Promise<ZohalCreditCheckResult | { error: string; status: number }> {
  const validated = validateInput(input);
  if ('error' in validated) return validated;
  const { nationalId, phone } = validated;
  const checkedAt = new Date();

  if (!isZohalConfigured()) {
    const payload = { skipped: true, reason: 'ZOHAL_TOKEN not set' } as Prisma.InputJsonValue;
    return {
      zohalStatus: 'skipped',
      zohalPayload: payload,
      shahkarMatched: null,
      zohalCheckedAt: checkedAt,
      summary: 'زحل: غیرفعال — بررسی دستی',
    };
  }

  const shahkar = await zohalShahkar(nationalId, phone);
  const matched = shahkar.ok ? shahkarMatched(shahkar.data) : null;
  const identity = await zohalNationalIdentity(nationalId);
  const bounced = await zohalBouncedCheque(nationalId);

  const payloadObj: Record<string, unknown> = {
    shahkar: shahkar.ok ? shahkar.data : { error: shahkar.error },
    identity: identity.ok ? identity.data : { error: identity.error },
    bouncedCheque: bounced.ok ? bounced.data : { error: bounced.error },
    shahkarMatched: matched,
    shahkarOk: shahkar.ok,
    bouncedOk: bounced.ok,
    creditOk: null,
  };

  const zohalStatus = resolveZohalStatus({
    shahkarOk: shahkar.ok,
    matched,
    creditOk: null,
    bouncedOk: bounced.ok,
  });

  return {
    zohalStatus,
    zohalPayload: payloadObj as Prisma.InputJsonValue,
    shahkarMatched: matched,
    zohalCheckedAt: checkedAt,
    summary: buildZohalCreditSummary(payloadObj),
  };
}

/** @deprecated Prefer runZohalBaseCheck + OTP flow. Kept for compatibility. */
export async function runZohalCreditCheck(
  input: ZohalCreditCheckInput,
): Promise<ZohalCreditCheckResult | { error: string; status: number }> {
  return runZohalBaseCheck(input);
}

export async function startZohalCreditOtp(
  input: ZohalCreditCheckInput,
  previousPayload?: Record<string, unknown> | null,
): Promise<ZohalCreditCheckResult | { error: string; status: number }> {
  const validated = validateInput(input);
  if ('error' in validated) return validated;
  const { nationalId, phone } = validated;
  const checkedAt = new Date();

  if (!isZohalConfigured()) {
    return {
      error: 'توکن زحل تنظیم نشده است.',
      status: 503,
    };
  }

  let basePayload = previousPayload ? { ...previousPayload } : null;
  if (!basePayload || basePayload.shahkarMatched !== true) {
    const base = await runZohalBaseCheck(input);
    if ('error' in base) return base;
    if (base.zohalStatus === 'failed' || base.zohalStatus === 'error') {
      return base;
    }
    basePayload =
      base.zohalPayload && typeof base.zohalPayload === 'object' && !Array.isArray(base.zohalPayload)
        ? { ...(base.zohalPayload as Record<string, unknown>) }
        : {};
  }

  const otpSend = await zohalCreditSendOtp(nationalId, phone);
  if (!otpSend.ok) {
    basePayload.credit = { error: otpSend.error };
    basePayload.creditOk = false;
    return {
      zohalStatus: 'partial',
      zohalPayload: basePayload as Prisma.InputJsonValue,
      shahkarMatched:
        typeof basePayload.shahkarMatched === 'boolean' ? basePayload.shahkarMatched : null,
      zohalCheckedAt: checkedAt,
      summary: buildZohalCreditSummary(basePayload),
    };
  }

  const referenceId = extractCreditReferenceId(otpSend.data);
  if (!referenceId) {
    basePayload.credit = { error: 'reference_id از زحل دریافت نشد.' };
    basePayload.creditOk = false;
    return {
      zohalStatus: 'partial',
      zohalPayload: basePayload as Prisma.InputJsonValue,
      shahkarMatched:
        typeof basePayload.shahkarMatched === 'boolean' ? basePayload.shahkarMatched : null,
      zohalCheckedAt: checkedAt,
      summary: buildZohalCreditSummary(basePayload),
    };
  }

  basePayload.creditOtp = {
    reference_id: referenceId,
    status: 'pending',
    sentAt: checkedAt.toISOString(),
  };
  delete basePayload.credit;
  basePayload.creditOk = null;

  return {
    zohalStatus: 'otp_pending',
    zohalPayload: basePayload as Prisma.InputJsonValue,
    shahkarMatched:
      typeof basePayload.shahkarMatched === 'boolean' ? basePayload.shahkarMatched : null,
    zohalCheckedAt: checkedAt,
    summary: buildZohalCreditSummary(basePayload),
    referenceId,
  };
}

async function pollCreditResult(referenceId: string) {
  let last = await zohalCreditGetResult(referenceId);
  for (let i = 0; i < 8; i += 1) {
    if (last.ok && isCreditResultCompleted(last.data)) return last;
    await sleep(1500);
    last = await zohalCreditGetResult(referenceId);
  }
  return last;
}

export async function completeZohalCreditOtp(input: {
  nationalId: string;
  phone: string;
  otp: string;
  referenceId?: string;
  previousPayload?: Record<string, unknown> | null;
}): Promise<ZohalCreditCheckResult | { error: string; status: number }> {
  const validated = validateInput(input);
  if ('error' in validated) return validated;
  const checkedAt = new Date();
  const otp = String(input.otp || '').trim();
  if (!otp) return { error: 'کد OTP الزامی است.', status: 400 };

  if (!isZohalConfigured()) {
    return { error: 'توکن زحل تنظیم نشده است.', status: 503 };
  }

  const basePayload: Record<string, unknown> = {
    ...(input.previousPayload && typeof input.previousPayload === 'object'
      ? input.previousPayload
      : {}),
  };

  const otpMeta = asRecord(basePayload.creditOtp);
  const referenceId = String(
    input.referenceId || otpMeta?.reference_id || '',
  ).trim();
  if (!referenceId) {
    return { error: 'شناسه استعلام اعتبار (reference_id) یافت نشد. دوباره OTP بفرستید.', status: 400 };
  }

  const verify = await zohalCreditVerifyOtp(otp, referenceId);
  if (!verify.ok) {
    basePayload.credit = { error: verify.error };
    basePayload.creditOk = false;
    basePayload.creditOtp = { ...(otpMeta || {}), reference_id: referenceId, status: 'failed' };
    return {
      zohalStatus: 'partial',
      zohalPayload: basePayload as Prisma.InputJsonValue,
      shahkarMatched:
        typeof basePayload.shahkarMatched === 'boolean' ? basePayload.shahkarMatched : null,
      zohalCheckedAt: checkedAt,
      summary: buildZohalCreditSummary(basePayload),
      referenceId,
    };
  }

  const credit = await pollCreditResult(referenceId);
  if (!credit.ok) {
    basePayload.credit = { error: credit.error };
    basePayload.creditOk = false;
  } else {
    basePayload.credit = credit.data;
    basePayload.creditOk = true;
  }
  basePayload.creditOtp = {
    reference_id: referenceId,
    status: credit.ok ? 'completed' : 'result_failed',
    verifiedAt: checkedAt.toISOString(),
  };

  // Refresh bounced cheque if missing
  if (!basePayload.bouncedCheque || hasServiceError(basePayload.bouncedCheque)) {
    const bounced = await zohalBouncedCheque(validated.nationalId);
    basePayload.bouncedCheque = bounced.ok ? bounced.data : { error: bounced.error };
    basePayload.bouncedOk = bounced.ok;
  }

  const matched =
    typeof basePayload.shahkarMatched === 'boolean' ? basePayload.shahkarMatched : null;
  const zohalStatus = resolveZohalStatus({
    shahkarOk: basePayload.shahkarOk !== false && matched !== null,
    matched,
    creditOk: basePayload.creditOk === true,
    bouncedOk: basePayload.bouncedOk !== false && !hasServiceError(basePayload.bouncedCheque),
  });

  return {
    zohalStatus,
    zohalPayload: basePayload as Prisma.InputJsonValue,
    shahkarMatched: matched,
    zohalCheckedAt: checkedAt,
    summary: buildZohalCreditSummary(basePayload),
    referenceId,
  };
}
