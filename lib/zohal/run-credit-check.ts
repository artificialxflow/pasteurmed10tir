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

export function buildZohalCreditSummary(payload: Record<string, unknown>): string {
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

export function zohalCreditStatusLabel(status?: string | null): string {
  if (status === 'passed') return 'زحل: تأیید کامل';
  if (status === 'partial') return 'زحل: ناقص';
  if (status === 'failed') return 'زحل: رد شاهکار';
  if (status === 'error') return 'زحل: خطا';
  if (status === 'skipped') return 'زحل: —';
  return status ? `زحل: ${status}` : 'زحل: —';
}

export function zohalCreditCheckNotice(status?: string | null): string {
  if (status === 'passed') return 'استعلام کامل شد — شاهکار، اعتبار و چک دریافت شد.';
  if (status === 'partial') {
    return 'شاهکار تأیید شد؛ اعتبار یا چک برگشتی خطا داشت. جزئیات در ستون خلاصه.';
  }
  if (status === 'failed') return 'شاهکار: کد ملی با موبایل تطبیق ندارد.';
  if (status === 'error') return 'خطا در استعلام زحل — جزئیات در ستون خلاصه.';
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
    shahkarMatched: shahkar.ok ? matched : null,
    zohalCheckedAt: checkedAt,
    summary,
  };
}
