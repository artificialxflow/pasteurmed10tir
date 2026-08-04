import { jsonError } from '@/lib/auth/api-utils';
import { mapBooking } from '@/lib/operations/mappers';
import { assertPhoneAccess, requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.booking.findUnique({ where: { id } });
  if (!row) return jsonError('رزرو یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone)) {
    return jsonError('دسترسی ندارید.', 403);
  }

  return NextResponse.json({ booking: mapBooking(row) });
}
