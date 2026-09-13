import { jsonError, parseJson } from '@/lib/auth/api-utils';
import {
  findFieldStaffByPhone,
  setOwnFieldStaffAvailability,
} from '@/lib/home-visit/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  try {
    const item = await findFieldStaffByPhone(auth.session.phone);
    return NextResponse.json({ item });
  } catch (e) {
    return prismaRouteError(e, 'field-staff/me GET');
  }
}

export async function PATCH(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const body = await parseJson<{ status?: string }>(request);
  if (!body?.status) return jsonError('وضعیت الزامی است.');

  try {
    const item = await setOwnFieldStaffAvailability(auth.session.phone, body.status);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message);
    return prismaRouteError(e, 'field-staff/me PATCH');
  }
}
