import { mapDbToPatientProfile } from '@/lib/auth/patient-db';
import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import type { PatientStatus } from '@/lib/patient';
import { clampFranchisePercent } from '@/lib/patient';
import { isValidNationalId, normalizeNationalId } from '@/lib/validation/national-id';
import {
  mergePatientStatusAfterZohal,
  runPatientShahkarVerification,
} from '@/lib/zohal/patient-verify';
import { NextResponse } from 'next/server';

type PatchBody = {
  phone?: string;
  status?: PatientStatus;
  reviewNote?: string;
  name?: string;
  nationalId?: string;
  franchisePercent?: number;
  baseInsuranceId?: string | null;
  complementaryInsuranceId?: string | null;
  recheckZohal?: boolean;
};

export async function GET() {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const users = await prisma.user.findMany({
    where: { profile: { isNot: null } },
    include: { profile: true },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    items: users.map((u) => mapDbToPatientProfile(u)),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const body = await parseJson<PatchBody>(request);
  const phone = normalizePhoneDigits(String(body?.phone || ''));
  if (!phone) return jsonError('شماره موبایل الزامی است.');

  const user = await prisma.user.findUnique({
    where: { phone },
    include: { profile: true },
  });
  if (!user?.profile) return jsonError('بیمار یافت نشد.', 404);

  const profileFieldsProvided =
    body?.name !== undefined ||
    body?.nationalId !== undefined ||
    body?.franchisePercent !== undefined ||
    body?.baseInsuranceId !== undefined ||
    body?.complementaryInsuranceId !== undefined;

  const statusProvided =
    body?.status !== undefined &&
    ['pending', 'approved', 'rejected'].includes(String(body.status));

  if (!statusProvided && !profileFieldsProvided && !body?.recheckZohal) {
    return jsonError('هیچ فیلدی برای به‌روزرسانی ارسال نشده است.');
  }

  let name = user.name;
  if (body?.name !== undefined) {
    name = body.name.trim() || user.name;
  }

  let nationalId = user.profile.nationalId || '';
  if (body?.nationalId !== undefined) {
    nationalId = normalizeNationalId(String(body.nationalId));
    if (!nationalId || !isValidNationalId(nationalId)) {
      return jsonError('کد ملی معتبر الزامی است.');
    }
  }

  const franchisePercent = clampFranchisePercent(
    body?.franchisePercent ?? user.profile.franchisePercent,
  );

  const baseInsuranceId =
    body?.baseInsuranceId !== undefined
      ? body.baseInsuranceId || null
      : user.profile.baseInsuranceId;
  const complementaryInsuranceId =
    body?.complementaryInsuranceId !== undefined
      ? body.complementaryInsuranceId || null
      : user.profile.complementaryInsuranceId;

  const insuranceChanged =
    baseInsuranceId !== user.profile.baseInsuranceId ||
    complementaryInsuranceId !== user.profile.complementaryInsuranceId ||
    franchisePercent !== user.profile.franchisePercent ||
    nationalId !== user.profile.nationalId;

  let status = user.profile.status;
  let reviewedAt = user.profile.reviewedAt;
  let reviewNote = user.profile.reviewNote;

  if (statusProvided) {
    status = body!.status!;
    reviewedAt = new Date();
    if (body?.reviewNote !== undefined) {
      reviewNote = body.reviewNote.trim() || null;
    }
  } else if (body?.reviewNote !== undefined) {
    reviewNote = body.reviewNote.trim() || null;
  }

  if (insuranceChanged && status === 'approved' && !statusProvided) {
    status = 'pending';
    reviewedAt = null;
    reviewNote = null;
  }

  let zohalFields: Awaited<ReturnType<typeof runPatientShahkarVerification>> | null = null;
  const shouldRunZohal =
    Boolean(body?.recheckZohal) ||
    (profileFieldsProvided && !statusProvided && Boolean(nationalId));

  if (shouldRunZohal && nationalId) {
    zohalFields = await runPatientShahkarVerification(nationalId, phone);
    if (!statusProvided) {
      status = mergePatientStatusAfterZohal(status, zohalFields);
      if (zohalFields.status === 'approved' || zohalFields.status === 'rejected') {
        reviewedAt = zohalFields.reviewedAt ?? new Date();
        reviewNote = zohalFields.reviewNote ?? null;
      }
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  await prisma.patientProfile.update({
    where: { userId: user.id },
    data: {
      nationalId,
      baseInsuranceId,
      complementaryInsuranceId,
      franchisePercent,
      status,
      reviewedAt,
      reviewNote,
      ...(zohalFields
        ? {
            zohalStatus: zohalFields.zohalStatus,
            zohalPayload: zohalFields.zohalPayload,
            shahkarMatched: zohalFields.shahkarMatched,
            zohalCheckedAt: zohalFields.zohalCheckedAt,
          }
        : {}),
    },
  });

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  if (!updated) return jsonError('خطا در ذخیره.', 500);

  return NextResponse.json({ profile: mapDbToPatientProfile(updated) });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;

  const phone = normalizePhoneDigits(
    new URL(request.url).searchParams.get('phone') || '',
  );
  if (!phone) return jsonError('شماره موبایل الزامی است.');

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return jsonError('بیمار یافت نشد.', 404);

  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
