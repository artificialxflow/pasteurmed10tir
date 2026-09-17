import { findFieldStaffByPhone, listStaffCommissions } from '@/lib/home-visit/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  try {
    const staff = await findFieldStaffByPhone(auth.session.phone);
    if (!staff) return NextResponse.json({ item: null, items: [] });
    const result = await listStaffCommissions({ staffId: staff.id });
    return NextResponse.json({ item: staff, ...result });
  } catch (e) {
    return prismaRouteError(e, 'field-staff/me/commissions GET');
  }
}
