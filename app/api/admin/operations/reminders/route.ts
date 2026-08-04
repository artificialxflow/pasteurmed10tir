import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapReminder } from '@/lib/operations/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('reminders');
  if (auth.error) return auth.error;

  const rows = await prisma.reminder.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items: rows.map(mapReminder) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('reminders');
  if (auth.error) return auth.error;

  const body = await parseJson<{ id?: string; status?: string; notified?: boolean }>(request);
  if (!body?.id) return jsonError('شناسه الزامی است.');

  const data: { status?: 'active' | 'cancelled' | 'sent'; notified?: boolean } = {};
  if (body.status === 'active' || body.status === 'cancelled' || body.status === 'sent') {
    data.status = body.status;
  }
  if (typeof body.notified === 'boolean') data.notified = body.notified;
  if (!Object.keys(data).length) return jsonError('داده‌ای برای بروزرسانی نیست.');

  const row = await prisma.reminder.update({ where: { id: body.id }, data });
  return NextResponse.json({ item: mapReminder(row) });
}
