import { jsonError } from '@/lib/auth/api-utils';
import { generateOperationId, mapComplaint } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('درخواست نامعتبر است.');
  }

  const patientPhone = normalizePhoneDigits(String(body.phone || ''));
  const patientName = String(body.name || '').trim();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  if (!patientPhone || !patientName || !subject || !message) {
    return jsonError('اطلاعات شکایت ناقص است.');
  }

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const row = await prisma.complaint.create({
    data: {
      id: generateOperationId(),
      userId,
      patientPhone,
      patientName,
      subject,
      message,
      status: 'new',
    },
  });

  return NextResponse.json({ item: mapComplaint(row) }, { status: 201 });
}
