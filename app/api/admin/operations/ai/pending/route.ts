import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'open';

  const rows = await prisma.aiPendingQuestion.findMany({
    where:
      status === 'all' || !['open', 'answered', 'dismissed'].includes(status)
        ? undefined
        : { status: status as 'open' | 'answered' | 'dismissed' },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      questionText: r.questionText,
      status: r.status,
      organizationId: r.organizationId,
      adminAnswerText: r.adminAnswerText,
      answerDocumentId: r.answerDocumentId,
      createdAt: r.createdAt.toISOString(),
      answeredAt: r.answeredAt?.toISOString() ?? null,
    })),
  });
}
