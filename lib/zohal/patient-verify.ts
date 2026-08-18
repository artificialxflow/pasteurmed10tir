import type { PatientStatus } from '@/lib/patient';
import type { Prisma } from '@prisma/client';
import { isZohalConfigured, shahkarMatched, zohalShahkar } from '@/lib/zohal/client';

export type ZohalStatus = 'skipped' | 'pending' | 'passed' | 'failed' | 'error';

export const SHAHKAR_REJECT_NOTE = 'کد ملی با شماره موبایل تطبیق ندارد (شاهکار).';

export type PatientZohalResult = {
  zohalStatus: ZohalStatus;
  zohalPayload?: Prisma.InputJsonValue;
  shahkarMatched?: boolean | null;
  zohalCheckedAt: Date;
  status?: PatientStatus;
  reviewedAt?: Date | null;
  reviewNote?: string | null;
};

export function zohalStatusLabel(status?: string | null, matched?: boolean | null): string {
  if (status === 'passed' || matched === true) return 'شاهکار: تطبیق';
  if (status === 'failed' || matched === false) return 'شاهکار: عدم تطبیق';
  if (status === 'error') return 'خطا در استعلام';
  if (status === 'pending') return 'در حال استعلام';
  if (status === 'skipped') return 'بررسی نشده (زحل غیرفعال)';
  return 'بررسی نشده';
}

export async function runPatientShahkarVerification(
  nationalId: string,
  phone: string,
): Promise<PatientZohalResult> {
  const now = new Date();
  if (!isZohalConfigured()) {
    return {
      zohalStatus: 'skipped',
      shahkarMatched: null,
      zohalCheckedAt: now,
    };
  }

  const shahkar = await zohalShahkar(nationalId, phone);
  const payload = {
    shahkar: shahkar.ok ? shahkar.data : { error: shahkar.error },
  } as Prisma.InputJsonValue;

  if (!shahkar.ok) {
    console.error('[zohal] patient shahkar error');
    return {
      zohalStatus: 'error',
      zohalPayload: payload,
      shahkarMatched: null,
      zohalCheckedAt: now,
    };
  }

  const matched = shahkarMatched(shahkar.data);
  if (matched === false) {
    return {
      zohalStatus: 'failed',
      zohalPayload: payload,
      shahkarMatched: false,
      zohalCheckedAt: now,
      status: 'rejected',
      reviewedAt: now,
      reviewNote: SHAHKAR_REJECT_NOTE,
    };
  }

  if (matched === true) {
    return {
      zohalStatus: 'passed',
      zohalPayload: payload,
      shahkarMatched: true,
      zohalCheckedAt: now,
      status: 'approved',
      reviewedAt: now,
      reviewNote: null,
    };
  }

  return {
    zohalStatus: 'error',
    zohalPayload: payload,
    shahkarMatched: null,
    zohalCheckedAt: now,
  };
}

export function mergePatientStatusAfterZohal(
  baseStatus: PatientStatus,
  zohal: PatientZohalResult,
): PatientStatus {
  if (zohal.status) return zohal.status;
  return baseStatus;
}
