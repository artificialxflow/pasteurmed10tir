import { jsonError, parseJson } from '@/lib/auth/api-utils';
import {
  findFieldStaffByPhone,
  setOwnFieldStaffAvailability,
} from '@/lib/home-visit/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

type Body = { status?: string };

export async function PATCH(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const body = await parseJson<Body>(request);
  if (!body?.status) return jsonError('وضعیت الزامی است.');

  try {
    const before = await findFieldStaffByPhone(auth.session.phone);
    if (!before) return jsonError('پروفایل کادر میدانی برای این شماره ثبت نشده است.', 404);
    const item = await setOwnFieldStaffAvailability(auth.session.phone, body.status);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'field-staff/me/availability PATCH');
  }
}
