import { embedDocumentFromBody } from '@/lib/ai/embed';
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

export async function createKnowledgeDocument(data: {
  title: string;
  body: string;
  source?: AiKnowledgeSource;
  organizationId?: string | null;
  published?: boolean;
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
  await embedDocumentFromBody(doc.id, doc.body || '', doc.title);
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
    await embedDocumentFromBody(doc.id, doc.body || '', doc.title);
  }
  return doc;
}

export async function answerPendingQuestion(id: string, answerText: string, title?: string) {
  const pending = await prisma.aiPendingQuestion.findUnique({ where: { id } });
  if (!pending || pending.status !== 'open') {
    throw new Error('NOT_FOUND');
  }

  const docTitle = title?.trim() || `پاسخ: ${pending.questionText.slice(0, 80)}`;
  const body = `سوال:\n${pending.questionText}\n\nپاسخ:\n${answerText.trim()}`;

  const doc = await createKnowledgeDocument({
    title: docTitle,
    body,
    source: 'from_pending',
    organizationId: pending.organizationId,
  });

  return prisma.aiPendingQuestion.update({
    where: { id },
    data: {
      status: 'answered',
      adminAnswerText: answerText.trim(),
      answerDocumentId: doc.id,
      answeredAt: new Date(),
    },
  });
}
