import { listStaffOwnJobs } from '@/lib/home-visit/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  try {
    const result = await listStaffOwnJobs(auth.session.phone);
    return NextResponse.json(result);
  } catch (e) {
    return prismaRouteError(e, 'field-staff/me/jobs GET');
  }
}
