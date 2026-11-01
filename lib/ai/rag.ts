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

export const SHORT_QUESTION_KEYWORD_MAX_LEN = 30;

function normalizeQuestionForKeywordMatch(question: string): string {
  return question.trim().replace(/\s+/g, ' ');
}

export async function findChunksByKeywordFallback(
  question: string,
  options?: { organizationId?: string | null; limit?: number },
): Promise<RetrievedChunk[]> {
  const normalized = normalizeQuestionForKeywordMatch(question);
  if (!normalized || normalized.length > SHORT_QUESTION_KEYWORD_MAX_LEN) return [];

  const orgId = options?.organizationId ?? null;
  const limit = options?.limit ?? 5;
  const pattern = `%${normalized}%`;

  if (orgId) {
    return prisma.$queryRawUnsafe<RetrievedChunk[]>(
      `SELECT c.id,
              c.content,
              c."documentId",
              d.title AS "documentTitle",
              0::double precision AS distance
       FROM "AiKnowledgeChunk" c
       INNER JOIN "AiKnowledgeDocument" d ON d.id = c."documentId"
       WHERE d.published = true
         AND (d."organizationId" IS NULL OR d."organizationId" = $3)
         AND c.content ILIKE $1
       ORDER BY length(c.content) DESC
       LIMIT $2`,
      pattern,
      limit,
      orgId,
    );
  }

  return prisma.$queryRawUnsafe<RetrievedChunk[]>(
    `SELECT c.id,
            c.content,
            c."documentId",
            d.title AS "documentTitle",
            0::double precision AS distance
     FROM "AiKnowledgeChunk" c
     INNER JOIN "AiKnowledgeDocument" d ON d.id = c."documentId"
     WHERE d.published = true
       AND d."organizationId" IS NULL
       AND c.content ILIKE $1
     ORDER BY length(c.content) DESC
     LIMIT $2`,
    pattern,
    limit,
  );
}

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

export async function findAnsweredPendingText(
  question: string,
  organizationId?: string | null,
): Promise<string | null> {
  const q = normalizeQuestionForKeywordMatch(question);
  if (!q) return null;

  const orgId = organizationId ?? null;

  const exact = await prisma.aiPendingQuestion.findFirst({
    where: {
      status: 'answered',
      adminAnswerText: { not: null },
      organizationId: orgId,
      questionText: { equals: q, mode: 'insensitive' },
    },
    orderBy: { answeredAt: 'desc' },
    select: { adminAnswerText: true },
  });
  const exactText = exact?.adminAnswerText?.trim();
  if (exactText) return exactText;

  if (q.length > SHORT_QUESTION_KEYWORD_MAX_LEN) return null;

  const candidates = await prisma.aiPendingQuestion.findMany({
    where: {
      status: 'answered',
      adminAnswerText: { not: null },
      organizationId: orgId,
      questionText: { contains: q, mode: 'insensitive' },
    },
    orderBy: { answeredAt: 'desc' },
    take: 5,
    select: { questionText: true, adminAnswerText: true },
  });

  for (const row of candidates) {
    const text = row.adminAnswerText?.trim();
    if (text) return text;
  }

  const shortStored = await prisma.aiPendingQuestion.findMany({
    where: {
      status: 'answered',
      adminAnswerText: { not: null },
      organizationId: orgId,
    },
    orderBy: { answeredAt: 'desc' },
    take: 100,
    select: { questionText: true, adminAnswerText: true },
  });

  const qLower = q.toLowerCase();
  for (const row of shortStored) {
    const stored = normalizeQuestionForKeywordMatch(row.questionText);
    if (!stored || stored.length > SHORT_QUESTION_KEYWORD_MAX_LEN) continue;
    if (qLower.includes(stored.toLowerCase()) || stored.toLowerCase().includes(qLower)) {
      const text = row.adminAnswerText?.trim();
      if (text) return text;
    }
  }

  return null;
}

export function extractAnswerFromKnowledgeChunks(chunks: RetrievedChunk[]): string | null {
  for (const chunk of chunks) {
    const match = chunk.content.match(/(?:^|\n)پاسخ:\n([\s\S]+)$/);
    const text = match?.[1]?.trim();
    if (text) return text;
  }
  return null;
}

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
