import { jsonError } from '@/lib/auth/api-utils';
import { mapSupportTicket } from '@/lib/operations/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('complaints');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const rows = await prisma.supportTicket.findMany({
    where:
      status && ['open', 'reviewing', 'closed'].includes(status)
        ? { status: status as 'open' | 'reviewing' | 'closed' }
        : undefined,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    items: rows.map((row) =>
      mapSupportTicket({ ...row, messages: row.messages.slice().reverse() }),
    ),
  });
}
