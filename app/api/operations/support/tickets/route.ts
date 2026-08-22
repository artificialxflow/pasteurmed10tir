import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateOperationId, mapSupportTicket } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await optionalPatient();
  if (!session) return jsonError('برای مشاهده تیکت‌ها وارد شوید.', 401);

  const phone = normalizePhoneDigits(session.phone);
  const rows = await prisma.supportTicket.findMany({
    where: {
      OR: [{ patientPhone: phone }, { userId: session.userId }],
    },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ items: rows.map((row) => mapSupportTicket(row)) });
}

export async function POST(request: Request) {
  const body = await parseJson<{ subject?: string; body?: string; name?: string; phone?: string }>(
    request,
  );
  if (!body) return jsonError('درخواست نامعتبر است.');

  const subject = String(body.subject || '').trim();
  const messageBody = String(body.body || '').trim();
  if (!subject || !messageBody) {
    return jsonError('موضوع و متن تیکت الزامی است.');
  }

  const session = await optionalPatient();
  const patientPhone = normalizePhoneDigits(
    session ? session.phone : String(body.phone || ''),
  );
  let patientName = String(body.name || '').trim();
  if (session && !patientName) {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    patientName = user?.name?.trim() || '';
  }

  if (!patientPhone || !patientName) {
    return jsonError('نام و موبایل الزامی است.');
  }

  const ticketId = generateOperationId();
  const messageId = generateOperationId();

  const row = await prisma.supportTicket.create({
    data: {
      id: ticketId,
      userId: session?.userId ?? null,
      patientPhone,
      patientName,
      subject,
      status: 'open',
      messages: {
        create: {
          id: messageId,
          sender: 'patient',
          body: messageBody,
        },
      },
    },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json({ item: mapSupportTicket(row, { includeMessages: true }) }, { status: 201 });
}
