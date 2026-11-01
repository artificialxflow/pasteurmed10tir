import { jsonError } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { answerPendingQuestion, updatePendingAnswer } from '@/lib/ai/admin-knowledge';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const { id } = await params;
  let body: { answerText?: string; title?: string; keywords?: string; action?: 'dismiss' };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError('بدنه نامعتبر است.', 400);
  }

  if (body.action === 'dismiss') {
    try {
      await prisma.aiPendingQuestion.update({
        where: { id },
        data: { status: 'dismissed' },
      });
      return NextResponse.json({ ok: true });
    } catch {
      return jsonError('یافت نشد.', 404);
    }
  }

  if (!body.answerText?.trim()) {
    return jsonError('متن پاسخ الزامی است.', 400);
  }

  try {
    const row = await answerPendingQuestion(id, body.answerText, body.title, body.keywords);
    return NextResponse.json({ ok: true, answerDocumentId: row.answerDocumentId });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return jsonError('سوال یافت نشد یا قبلاً بسته شده.', 404);
    }
    console.error('[admin ai pending answer]', err);
    return jsonError('ثبت پاسخ ناموفق بود.', 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const { id } = await params;
  let body: { answerText?: string; keywords?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError('بدنه نامعتبر است.', 400);
  }

  if (!body.answerText?.trim()) {
    return jsonError('متن پاسخ الزامی است.', 400);
  }

  try {
    const row = await updatePendingAnswer(id, body.answerText, body.keywords);
    return NextResponse.json({ ok: true, answerDocumentId: row.answerDocumentId });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return jsonError('سوال یافت نشد یا هنوز پاسخ داده نشده.', 404);
    }
    console.error('[admin ai pending update]', err);
    return jsonError('به‌روزرسانی پاسخ ناموفق بود.', 500);
  }
}
