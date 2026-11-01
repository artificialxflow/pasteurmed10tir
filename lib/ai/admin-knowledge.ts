import {
  embedDocumentFromBody,
  embedPendingAnswerDocument,
  parseKeywordList,
} from '@/lib/ai/embed';
import { buildSiteMapCorpus, SITE_MAP_DOCUMENT_TITLE } from '@/lib/ai/site-map-ingest';
import { prisma } from '@/lib/prisma';
import type { AiKnowledgeSource, Prisma } from '@prisma/client';

export async function ingestSiteMapDocument() {
  const body = buildSiteMapCorpus();
  const existing = await prisma.aiKnowledgeDocument.findFirst({
    where: { source: 'site_map', organizationId: null },
  });

  const doc = existing
    ? await prisma.aiKnowledgeDocument.update({
        where: { id: existing.id },
        data: { title: SITE_MAP_DOCUMENT_TITLE, body, published: true },
      })
    : await prisma.aiKnowledgeDocument.create({
        data: {
          title: SITE_MAP_DOCUMENT_TITLE,
          source: 'site_map',
          body,
          published: true,
        },
      });

  await embedDocumentFromBody(doc.id, body, doc.title);
  return doc;
}

export function buildPendingAnswerBody(input: {
  questionText: string;
  answerText: string;
  keywords?: string;
}): string {
  const parts = parseKeywordList(input.keywords);
  const kwBlock = parts.length ? `کلمات کلیدی: ${parts.join('، ')}\n\n` : '';
  return `${kwBlock}سوال:\n${input.questionText.trim()}\n\nپاسخ:\n${input.answerText.trim()}`;
}

const KNOWLEDGE_PREVIEW_MAX = 160;

export function knowledgeBodyPreview(body: string | null | undefined): string {
  if (!body?.trim()) return '';
  const parsed = parsePendingDocumentBody(body);
  const text = (parsed.answerText || body.trim()).replace(/\s+/g, ' ').trim();
  if (text.length <= KNOWLEDGE_PREVIEW_MAX) return text;
  return `${text.slice(0, KNOWLEDGE_PREVIEW_MAX)}…`;
}

export function parsePendingDocumentBody(body: string): {
  questionText: string;
  answerText: string;
  keywords?: string;
} {
  const trimmed = body.trim();
  const kwMatch = trimmed.match(/^کلمات کلیدی:\s*(.+?)(?:\n\n)/);
  let keywords: string | undefined;
  let rest = trimmed;
  if (kwMatch) {
    keywords = kwMatch[1].trim();
    rest = trimmed.slice(kwMatch[0].length);
  }
  const qa = rest.match(/^سوال:\n([\s\S]*?)\n\nپاسخ:\n([\s\S]*)$/);
  if (qa) {
    return { questionText: qa[1].trim(), answerText: qa[2].trim(), keywords };
  }
  return { questionText: '', answerText: trimmed, keywords };
}

async function reembedKnowledgeDocument(doc: {
  id: string;
  title: string;
  body: string | null;
  source: AiKnowledgeSource;
}) {
  if (doc.source === 'from_pending') {
    const parsed = parsePendingDocumentBody(doc.body || '');
    let questionText = parsed.questionText;
    if (!questionText) {
      const linked = await prisma.aiPendingQuestion.findFirst({
        where: { answerDocumentId: doc.id },
        select: { questionText: true },
      });
      questionText = linked?.questionText || doc.title;
    }
    await embedPendingAnswerDocument(doc.id, {
      title: doc.title,
      questionText,
      answerText: parsed.answerText,
      keywords: parsed.keywords,
      fullBody: doc.body || '',
    });
    return;
  }
  await embedDocumentFromBody(doc.id, doc.body || '', doc.title);
}

export async function createKnowledgeDocument(data: {
  title: string;
  body: string;
  source?: AiKnowledgeSource;
  organizationId?: string | null;
  published?: boolean;
  pendingEmbed?: { questionText: string; answerText: string; keywords?: string };
}) {
  const doc = await prisma.aiKnowledgeDocument.create({
    data: {
      title: data.title.trim(),
      body: data.body.trim(),
      source: data.source ?? 'admin_manual',
      organizationId: data.organizationId || null,
      published: data.published ?? true,
    },
  });
  if (data.pendingEmbed) {
    await embedPendingAnswerDocument(doc.id, {
      title: doc.title,
      questionText: data.pendingEmbed.questionText,
      answerText: data.pendingEmbed.answerText,
      keywords: data.pendingEmbed.keywords,
      fullBody: doc.body || '',
    });
  } else {
    await embedDocumentFromBody(doc.id, doc.body || '', doc.title);
  }
  return doc;
}

export async function updateKnowledgeDocument(
  id: string,
  data: {
    title?: string;
    body?: string;
    published?: boolean;
    organizationId?: string | null;
    reembed?: boolean;
  },
) {
  const update: Prisma.AiKnowledgeDocumentUpdateInput = {};
  if (data.title !== undefined) update.title = data.title.trim();
  if (data.body !== undefined) update.body = data.body.trim();
  if (data.published !== undefined) update.published = data.published;
  if (data.organizationId !== undefined) {
    update.organization = data.organizationId
      ? { connect: { id: data.organizationId } }
      : { disconnect: true };
  }

  const doc = await prisma.aiKnowledgeDocument.update({ where: { id }, data: update });
  if (data.reembed !== false && (data.body !== undefined || data.title !== undefined)) {
    await reembedKnowledgeDocument(doc);
  }
  return doc;
}

export async function answerPendingQuestion(
  id: string,
  answerText: string,
  title?: string,
  keywords?: string,
) {
  const pending = await prisma.aiPendingQuestion.findUnique({ where: { id } });
  if (!pending || pending.status !== 'open') {
    throw new Error('NOT_FOUND');
  }

  const trimmedAnswer = answerText.trim();
  const docTitle = title?.trim() || `پاسخ: ${pending.questionText.slice(0, 80)}`;
  const body = buildPendingAnswerBody({
    questionText: pending.questionText,
    answerText: trimmedAnswer,
    keywords,
  });

  const doc = await createKnowledgeDocument({
    title: docTitle,
    body,
    source: 'from_pending',
    organizationId: pending.organizationId,
    pendingEmbed: {
      questionText: pending.questionText,
      answerText: trimmedAnswer,
      keywords,
    },
  });

  return prisma.aiPendingQuestion.update({
    where: { id },
    data: {
      status: 'answered',
      adminAnswerText: trimmedAnswer,
      answerDocumentId: doc.id,
      answeredAt: new Date(),
    },
  });
}

export async function updatePendingAnswer(id: string, answerText: string, keywords?: string) {
  const pending = await prisma.aiPendingQuestion.findUnique({ where: { id } });
  if (!pending || pending.status !== 'answered') {
    throw new Error('NOT_FOUND');
  }

  const trimmedAnswer = answerText.trim();
  const body = buildPendingAnswerBody({
    questionText: pending.questionText,
    answerText: trimmedAnswer,
    keywords,
  });

  let answerDocumentId = pending.answerDocumentId;

  if (answerDocumentId) {
    const doc = await prisma.aiKnowledgeDocument.update({
      where: { id: answerDocumentId },
      data: { body },
    });
    await embedPendingAnswerDocument(doc.id, {
      title: doc.title,
      questionText: pending.questionText,
      answerText: trimmedAnswer,
      keywords,
      fullBody: body,
    });
  } else {
    const docTitle = `پاسخ: ${pending.questionText.slice(0, 80)}`;
    const doc = await createKnowledgeDocument({
      title: docTitle,
      body,
      source: 'from_pending',
      organizationId: pending.organizationId,
      pendingEmbed: {
        questionText: pending.questionText,
        answerText: trimmedAnswer,
        keywords,
      },
    });
    answerDocumentId = doc.id;
  }

  return prisma.aiPendingQuestion.update({
    where: { id },
    data: {
      adminAnswerText: trimmedAnswer,
      answerDocumentId,
    },
  });
}

/** بازسازی chunkهای جستجو برای همه پاسخ‌های ثبت‌شده از صف (پس از deploy یا داده قدیمی) */
export async function reembedAllAnsweredPendingKnowledge(): Promise<{ count: number }> {
  const rows = await prisma.aiPendingQuestion.findMany({
    where: { status: 'answered', answerDocumentId: { not: null } },
    include: { answerDocument: true },
  });

  let count = 0;
  for (const row of rows) {
    if (!row.answerDocumentId || !row.answerDocument || !row.adminAnswerText?.trim()) continue;

    const parsed = parsePendingDocumentBody(row.answerDocument.body || '');
    const questionText = parsed.questionText || row.questionText;
    const answerText = row.adminAnswerText.trim();
    const keywords = parsed.keywords;
    const body = buildPendingAnswerBody({ questionText, answerText, keywords });

    await prisma.aiKnowledgeDocument.update({
      where: { id: row.answerDocumentId },
      data: { body },
    });
    await embedPendingAnswerDocument(row.answerDocumentId, {
      title: row.answerDocument.title,
      questionText,
      answerText,
      keywords,
      fullBody: body,
    });
    count += 1;
  }

  return { count };
}

export async function reembedKnowledgeDocumentById(id: string): Promise<void> {
  const doc = await prisma.aiKnowledgeDocument.findUnique({ where: { id } });
  if (!doc) throw new Error('NOT_FOUND');
  await reembedKnowledgeDocument(doc);
}
