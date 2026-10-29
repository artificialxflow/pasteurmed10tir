import { jsonError } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { createKnowledgeDocument } from '@/lib/ai/admin-knowledge';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  const rows = await prisma.aiKnowledgeDocument.findMany({
    where: organizationId ? { organizationId } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { chunks: true } } },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      source: r.source,
      organizationId: r.organizationId,
      published: r.published,
      chunkCount: r._count.chunks,
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  let body: {
    title?: string;
    body?: string;
    organizationId?: string;
    source?: 'admin_manual' | 'org_policy';
    published?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError('بدنه نامعتبر است.', 400);
  }

  if (!body.title?.trim() || !body.body?.trim()) {
    return jsonError('عنوان و متن الزامی است.', 400);
  }

  try {
    const doc = await createKnowledgeDocument({
      title: body.title,
      body: body.body,
      organizationId: body.organizationId,
      source: body.source ?? (body.organizationId ? 'org_policy' : 'admin_manual'),
      published: body.published,
    });
    return NextResponse.json({ id: doc.id });
  } catch (err) {
    console.error('[admin ai documents POST]', err);
    return jsonError('ذخیره دانش ناموفق بود.', 500);
  }
}
