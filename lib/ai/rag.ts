import { prisma } from '@/lib/prisma';
import { getAiSettings } from '@/lib/ai/settings';
import { vectorLiteral } from '@/lib/ai/embed';
import { chatCompletion } from '@/lib/ai/client';

export type RetrievedChunk = {
  id: string;
  content: string;
  documentId: string;
  documentTitle: string;
  distance: number;
};

export async function retrieveChunks(
  queryEmbedding: number[],
  options?: { organizationId?: string | null; topK?: number },
): Promise<RetrievedChunk[]> {
  const settings = await getAiSettings();
  const topK = options?.topK ?? settings.retrievalTopK;
  const orgId = options?.organizationId ?? null;
  const vec = vectorLiteral(queryEmbedding);

  if (orgId) {
    return prisma.$queryRawUnsafe<RetrievedChunk[]>(
      `SELECT c.id,
              c.content,
              c."documentId",
              d.title AS "documentTitle",
              (c.embedding <=> $1::vector) AS distance
       FROM "AiKnowledgeChunk" c
       INNER JOIN "AiKnowledgeDocument" d ON d.id = c."documentId"
       WHERE d.published = true
         AND c.embedding IS NOT NULL
         AND (d."organizationId" IS NULL OR d."organizationId" = $3)
       ORDER BY c.embedding <=> $1::vector
       LIMIT $2`,
      vec,
      topK,
      orgId,
    );
  }

  return prisma.$queryRawUnsafe<RetrievedChunk[]>(
    `SELECT c.id,
            c.content,
            c."documentId",
            d.title AS "documentTitle",
            (c.embedding <=> $1::vector) AS distance
     FROM "AiKnowledgeChunk" c
     INNER JOIN "AiKnowledgeDocument" d ON d.id = c."documentId"
     WHERE d.published = true
       AND c.embedding IS NOT NULL
       AND d."organizationId" IS NULL
     ORDER BY c.embedding <=> $1::vector
     LIMIT $2`,
    vec,
    topK,
  );
}

const SYSTEM_PROMPT = `تو دستیار فارسی‌زبان سایت پاستور پلاس (pasteur.plus) هستی.
فقط بر اساس «متن مرجع» زیر پاسخ بده. اگر پاسخ در متن مرجع نیست، صادقانه بگو در دانش رسمی سایت پاسخی نداریم و پیشنهاد بده از بخش پشتیبانی یا تماس با کلینیک کمک بگیرند.
برای تشخیص پزشکی، تجویز دارو، یا تصمیم حقوقی/مالی قطعی، کاربر را به پزشک یا واحد رسمی ارجاع بده.
پاسخ را کوتاه، مودبانه و قابل فهم بنویس.`;

export async function answerFromRetrieval(
  question: string,
  chunks: RetrievedChunk[],
): Promise<string> {
  const context = chunks
    .map((c, i) => `[${i + 1}] (${c.documentTitle})\n${c.content}`)
    .join('\n\n---\n\n');

  return chatCompletion([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `متن مرجع:\n${context}\n\n---\n\nسوال کاربر:\n${question}`,
    },
  ]);
}

export async function enqueuePendingQuestion(input: {
  questionText: string;
  userId?: string | null;
  sessionId?: string | null;
  organizationId?: string | null;
}) {
  return prisma.aiPendingQuestion.create({
    data: {
      questionText: input.questionText.trim(),
      userId: input.userId || null,
      sessionId: input.sessionId || null,
      organizationId: input.organizationId || null,
      status: 'open',
    },
  });
}
