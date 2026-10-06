import { findActiveVisitorByPhone } from '@/lib/commerce/visitor-service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  try {
    const item = await findActiveVisitorByPhone(auth.session.phone);
    return NextResponse.json({ item });
  } catch (e) {
    return prismaRouteError(e, 'marketing/me GET');
  }
}
