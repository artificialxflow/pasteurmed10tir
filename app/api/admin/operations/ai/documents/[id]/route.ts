import { jsonError } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { updateKnowledgeDocument } from '@/lib/ai/admin-knowledge';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const { id } = await params;
  const doc = await prisma.aiKnowledgeDocument.findUnique({
    where: { id },
    include: { chunks: { select: { id: true, content: true }, orderBy: { createdAt: 'asc' } } },
  });
  if (!doc) return jsonError('یافت نشد.', 404);

  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    body: doc.body,
    source: doc.source,
    organizationId: doc.organizationId,
    published: doc.published,
    chunks: doc.chunks,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const { id } = await params;
  let body: {
    title?: string;
    body?: string;
    published?: boolean;
    organizationId?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError('بدنه نامعتبر است.', 400);
  }

  try {
    const doc = await updateKnowledgeDocument(id, body);
    return NextResponse.json({ ok: true, id: doc.id });
  } catch {
    return jsonError('به‌روزرسانی ناموفق بود.', 404);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    await prisma.aiKnowledgeDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError('حذف ناموفق بود.', 404);
  }
}
