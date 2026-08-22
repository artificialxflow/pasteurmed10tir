import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateOperationId, mapSupportTicket } from '@/lib/operations/mappers';
import { assertPhoneAccess, requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!row) return jsonError('تیکت یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone) && row.userId !== auth.session.userId) {
    return jsonError('دسترسی ندارید.', 403);
  }

  return NextResponse.json({ item: mapSupportTicket(row, { includeMessages: true }) });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const body = await parseJson<{ body?: string }>(request);
  const messageBody = String(body?.body || '').trim();
  if (!messageBody) return jsonError('متن پیام الزامی است.');

  const { id } = await context.params;
  const row = await prisma.supportTicket.findUnique({ where: { id } });
  if (!row) return jsonError('تیکت یافت نشد.', 404);
  if (!assertPhoneAccess(auth.session, row.patientPhone) && row.userId !== auth.session.userId) {
    return jsonError('دسترسی ندارید.', 403);
  }
  if (row.status === 'closed') {
    return jsonError('این تیکت بسته شده است.');
  }

  await prisma.supportMessage.create({
    data: {
      id: generateOperationId(),
      ticketId: id,
      sender: 'patient',
      body: messageBody,
    },
  });

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { status: row.status === 'open' ? 'open' : 'reviewing', updatedAt: new Date() },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json({ item: mapSupportTicket(updated, { includeMessages: true }) });
}
