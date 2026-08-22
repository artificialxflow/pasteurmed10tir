import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateOperationId, mapSupportTicket } from '@/lib/operations/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin('complaints');
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!row) return jsonError('تیکت یافت نشد.', 404);

  return NextResponse.json({ item: mapSupportTicket(row, { includeMessages: true }) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin('complaints');
  if (auth.error) return auth.error;

  const body = await parseJson<{ status?: string; priority?: string }>(request);
  const { id } = await context.params;

  const status =
    body?.status && ['open', 'reviewing', 'closed'].includes(body.status)
      ? (body.status as 'open' | 'reviewing' | 'closed')
      : undefined;
  if (!status && body?.priority === undefined) {
    return jsonError('وضعیت یا اولویت الزامی است.');
  }

  const row = await prisma.supportTicket.findUnique({ where: { id } });
  if (!row) return jsonError('تیکت یافت نشد.', 404);

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(status ? { status, closedAt: status === 'closed' ? new Date() : null } : {}),
      ...(body?.priority !== undefined ? { priority: String(body.priority || '') || null } : {}),
    },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json({ item: mapSupportTicket(updated, { includeMessages: true }) });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin('complaints');
  if (auth.error) return auth.error;

  const body = await parseJson<{ body?: string }>(request);
  const messageBody = String(body?.body || '').trim();
  if (!messageBody) return jsonError('متن پاسخ الزامی است.');

  const { id } = await context.params;
  const row = await prisma.supportTicket.findUnique({ where: { id } });
  if (!row) return jsonError('تیکت یافت نشد.', 404);

  await prisma.supportMessage.create({
    data: {
      id: generateOperationId(),
      ticketId: id,
      sender: 'admin',
      body: messageBody,
    },
  });

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { status: row.status === 'closed' ? 'reviewing' : 'reviewing', updatedAt: new Date() },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json({ item: mapSupportTicket(updated, { includeMessages: true }) });
}
