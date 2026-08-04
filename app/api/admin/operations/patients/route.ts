import { mapDbToPatientProfile } from '@/lib/auth/patient-db';
import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import type { PatientStatus } from '@/lib/patient';
import { NextResponse } from 'next/server';

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

  const body = await parseJson<{ phone?: string; status?: PatientStatus; reviewNote?: string }>(
    request,
  );
  const phone = normalizePhoneDigits(String(body?.phone || ''));
  if (!phone) return jsonError('شماره موبایل الزامی است.');

  const status = body?.status;
  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return jsonError('وضعیت نامعتبر است.');
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    include: { profile: true },
  });
  if (!user?.profile) return jsonError('بیمار یافت نشد.', 404);

  await prisma.patientProfile.update({
    where: { userId: user.id },
    data: {
      status,
      reviewNote: body?.reviewNote?.trim() || null,
      reviewedAt: new Date(),
    },
  });

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  if (!updated) return jsonError('خطا در ذخیره.', 500);

  return NextResponse.json({ profile: mapDbToPatientProfile(updated) });
}
