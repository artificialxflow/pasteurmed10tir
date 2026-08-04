import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapReminder } from '@/lib/operations/mappers';
import { assertPhoneAccess, requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await parseJson<{ notified?: boolean; status?: string }>(request);

  const row = await prisma.reminder.findUnique({ where: { id } });
  if (!row) return jsonError('یادآور یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone)) {
    return jsonError('دسترسی مجاز نیست.', 403);
  }

  const data: { notified?: boolean; status?: 'active' | 'cancelled' | 'sent' } = {};
  if (body?.notified === true) data.notified = true;
  if (body?.status === 'cancelled') data.status = 'cancelled';

  if (!Object.keys(data).length) return jsonError('بدون تغییر.');

  const updated = await prisma.reminder.update({ where: { id }, data });
  return NextResponse.json({ item: mapReminder(updated) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.reminder.findUnique({ where: { id } });
  if (!row) return jsonError('یادآور یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone)) {
    return jsonError('دسترسی مجاز نیست.', 403);
  }

  await prisma.reminder.update({
    where: { id },
    data: { status: 'cancelled' },
  });

  return NextResponse.json({ ok: true });
}
