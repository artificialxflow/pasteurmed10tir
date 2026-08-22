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

function buildSummary(payload: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof payload.shahkarMatched === 'boolean') {
    parts.push(payload.shahkarMatched ? 'شاهکار: تطبیق' : 'شاهکار: عدم تطبیق');
  }
  if (payload.credit && typeof payload.credit === 'object') {
    const c = payload.credit as Record<string, unknown>;
    parts.push(c.error ? 'اعتبار: خطا' : 'اعتبار: دریافت شد');
  }
  if (payload.bouncedCheque && typeof payload.bouncedCheque === 'object') {
    const b = payload.bouncedCheque as Record<string, unknown>;
    parts.push(b.error ? 'چک: خطا' : 'چک: دریافت شد');
  }
  return parts.join(' · ') || '—';
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
  const matched = shahkar.ok ? shahkarMatched(shahkar.data) : false;
  const identity = await zohalNationalIdentity(nationalId);
  const credit = await zohalCreditInquiry(nationalId);
  const bounced = await zohalBouncedCheque(nationalId);

  const payloadObj = {
    shahkar: shahkar.ok ? shahkar.data : { error: shahkar.error },
    identity: identity.ok ? identity.data : { error: identity.error },
    credit: credit.ok ? credit.data : { error: credit.error },
    bouncedCheque: bounced.ok ? bounced.data : { error: bounced.error },
    shahkarMatched: matched,
  };

  const zohalPayload = payloadObj as Prisma.InputJsonValue;
  const summary = buildSummary(payloadObj);

  if (!shahkar.ok) {
    return {
      zohalStatus: 'error',
      zohalPayload,
      shahkarMatched: null,
      zohalCheckedAt: checkedAt,
      summary: summary || 'زحل: خطا',
    };
  }

  if (matched === false) {
    return {
      zohalStatus: 'failed',
      zohalPayload,
      shahkarMatched: false,
      zohalCheckedAt: checkedAt,
      summary,
    };
  }

  return {
    zohalStatus: 'passed',
    zohalPayload,
    shahkarMatched: true,
    zohalCheckedAt: checkedAt,
    summary,
  };
}
