import type { Prisma } from '@prisma/client';
import { isValidNationalId, normalizeNationalId } from '@/lib/validation/national-id';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import {
  isZohalConfigured,
  shahkarMatched,
  zohalBouncedCheque,
  zohalCreditInquiry,
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

  const creditErr = hasServiceError(payload.credit);
  if (creditErr) {
    parts.push(`اعتبار: ناموفق (${truncateError(creditErr)})`);
  } else if (payload.credit) {
    parts.push('اعتبار: دریافت شد');
  }

  const chequeErr = hasServiceError(payload.bouncedCheque);
  if (chequeErr) {
    parts.push(`چک برگشتی: ناموفق (${truncateError(chequeErr)})`);
  } else if (payload.bouncedCheque) {
    parts.push('چک برگشتی: دریافت شد');
  }

  return parts.join('\n') || '—';
}

export function zohalCreditStatusLabel(status?: string | null): string {
  if (status === 'passed') return 'زحل: تأیید کامل';
  if (status === 'partial') return 'زحل: ناقص';
  if (status === 'failed') return 'زحل: رد شاهکار';
  if (status === 'error') return 'زحل: خطا شاهکار';
  if (status === 'skipped') return 'زحل: —';
  return status ? `زحل: ${status}` : 'زحل: —';
}

export function zohalCreditCheckNotice(status?: string | null): string {
  if (status === 'passed') return 'استعلام کامل شد — شاهکار، اعتبار و چک دریافت شد.';
  if (status === 'partial') {
    return 'شاهکار انجام شد؛ بخش اعتبار یا چک برگشتی ناموفق بود (جزئیات در ستون خلاصه). این لزوماً رد شاهکار نیست.';
  }
  if (status === 'failed') return 'شاهکار: کد ملی با موبایل تطبیق ندارد.';
  if (status === 'error') return 'خطا در سرویس شاهکار — جزئیات در ستون خلاصه.';
  if (status === 'skipped') return 'زحل غیرفعال است — بررسی دستی لازم است.';
  return 'استعلام انجام شد.';
}

function resolveZohalStatus(input: {
  shahkarOk: boolean;
  matched: boolean | null;
  creditOk: boolean;
  bouncedOk: boolean;
}): string {
  if (!input.shahkarOk) return 'error';
  if (input.matched === false) return 'failed';
  if (input.matched == null) return 'error';
  if (!input.creditOk || !input.bouncedOk) return 'partial';
  return 'passed';
}

export async function runZohalCreditCheck(
  input: ZohalCreditCheckInput,
): Promise<ZohalCreditCheckResult | { error: string; status: number }> {
  const nationalId = normalizeNationalId(input.nationalId);
  const phone = normalizePhoneDigits(input.phone);
  const checkedAt = new Date();

  if (!nationalId || !isValidNationalId(nationalId)) {
    return { error: 'کد ملی معتبر الزامی است.', status: 400 };
  }
  if (!phone) {
    return { error: 'شماره موبایل الزامی است.', status: 400 };
  }

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
  const credit = await zohalCreditInquiry(nationalId);
  const bounced = await zohalBouncedCheque(nationalId);

  const payloadObj = {
    shahkar: shahkar.ok ? shahkar.data : { error: shahkar.error },
    identity: identity.ok ? identity.data : { error: identity.error },
    credit: credit.ok ? credit.data : { error: credit.error },
    bouncedCheque: bounced.ok ? bounced.data : { error: bounced.error },
    shahkarMatched: matched,
    shahkarOk: shahkar.ok,
    creditOk: credit.ok,
    bouncedOk: bounced.ok,
  };

  const zohalPayload = payloadObj as Prisma.InputJsonValue;
  const summary = buildZohalCreditSummary(payloadObj);
  const zohalStatus = resolveZohalStatus({
    shahkarOk: shahkar.ok,
    matched,
    creditOk: credit.ok,
    bouncedOk: bounced.ok,
  });

  return {
    zohalStatus,
    zohalPayload,
    shahkarMatched: matched,
    zohalCheckedAt: checkedAt,
    summary,
  };
}
