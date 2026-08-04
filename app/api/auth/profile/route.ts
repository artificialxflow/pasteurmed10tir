import { mapDbToPatientProfile } from '@/lib/auth/patient-db';
import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { getPatientSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { clampFranchisePercent } from '@/lib/patient';
import { NextResponse } from 'next/server';

type Body = {
  name?: string;
  nationalId?: string;
  baseInsuranceId?: string;
  complementaryInsuranceId?: string;
  franchisePercent?: number;
};

export async function PATCH(request: Request) {
  const session = await getPatientSession();
  if (!session) return jsonError('وارد نشده‌اید.', 401);

  const body = await parseJson<Body>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  });
  if (!user || !user.profile) return jsonError('پروفایل یافت نشد.', 404);

  const name = body.name?.trim() || user.name;
  const franchisePercent = clampFranchisePercent(
    body.franchisePercent ?? user.profile.franchisePercent,
  );

  const insuranceChanged =
    (body.baseInsuranceId !== undefined &&
      body.baseInsuranceId !== user.profile.baseInsuranceId) ||
    (body.complementaryInsuranceId !== undefined &&
      body.complementaryInsuranceId !== user.profile.complementaryInsuranceId) ||
    franchisePercent !== user.profile.franchisePercent;

  let status = user.profile.status;
  if (insuranceChanged && status === 'approved') {
    status = 'pending';
  }

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  await prisma.patientProfile.update({
    where: { userId: user.id },
    data: {
      nationalId: body.nationalId?.trim() || null,
      baseInsuranceId: body.baseInsuranceId || null,
      complementaryInsuranceId: body.complementaryInsuranceId || null,
      franchisePercent,
      status,
    },
  });

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  if (!updated) return jsonError('خطا در ذخیره.', 500);

  return NextResponse.json({ profile: mapDbToPatientProfile(updated) });
}
