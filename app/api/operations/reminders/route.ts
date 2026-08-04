import { jsonError } from '@/lib/auth/api-utils';
import { generateOperationId, mapReminder } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await optionalPatient();
  if (!session) return jsonError('وارد نشده‌اید.', 401);

  const rows = await prisma.reminder.findMany({
    where: { patientPhone: session.phone },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items: rows.map(mapReminder) });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('درخواست نامعتبر است.');
  }

  const patientPhone = normalizePhoneDigits(String(body.patientPhone || body.phone || ''));
  if (!patientPhone) return jsonError('شماره موبایل معتبر نیست.');

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const row = await prisma.reminder.create({
    data: {
      id: generateOperationId(),
      userId,
      bookingId: body.bookingId ? String(body.bookingId) : null,
      patientPhone,
      patientName: body.patientName ? String(body.patientName) : null,
      doctorName: body.doctorName ? String(body.doctorName) : null,
      day: body.day ? String(body.day) : null,
      timeLabel: body.timeLabel ? String(body.timeLabel) : null,
      typeLabel: body.typeLabel ? String(body.typeLabel) : null,
      optionId: body.optionId ? String(body.optionId) : null,
      optionLabel: body.optionLabel ? String(body.optionLabel) : null,
      status: 'active',
    },
  });

  return NextResponse.json({ item: mapReminder(row) }, { status: 201 });
}
