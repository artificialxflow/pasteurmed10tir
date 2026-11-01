import { jsonError } from '@/lib/auth/api-utils';
import { reembedKnowledgeDocumentById } from '@/lib/ai/admin-knowledge';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const { id } = await params;
  const doc = await prisma.aiKnowledgeDocument.findUnique({ where: { id } });
  if (!doc) return jsonError('یافت نشد.', 404);

  try {
    await reembedKnowledgeDocumentById(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin ai reembed]', err);
    return jsonError('بازسازی embedding ناموفق بود.', 500);
  }
}
