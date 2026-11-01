import { EMBEDDING_DIMENSIONS } from '@/lib/ai/config';
import { createEmbedding } from '@/lib/ai/client';
import { prisma } from '@/lib/prisma';

export function vectorLiteral(values: number[]): string {
  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${values.length}`);
  }
  return `[${values.join(',')}]`;
}

export function splitTextIntoChunks(text: string, maxChars = 1200): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let buf = '';

  for (const p of paragraphs) {
    const piece = p.trim();
    if (!piece) continue;
    if ((buf + '\n\n' + piece).length <= maxChars) {
      buf = buf ? `${buf}\n\n${piece}` : piece;
    } else {
      if (buf) chunks.push(buf);
      if (piece.length <= maxChars) {
        buf = piece;
      } else {
        for (let i = 0; i < piece.length; i += maxChars) {
          chunks.push(piece.slice(i, i + maxChars));
        }
        buf = '';
      }
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

export async function replaceDocumentChunks(documentId: string, contents: string[]): Promise<void> {
  await prisma.aiKnowledgeChunk.deleteMany({ where: { documentId } });

  for (const content of contents) {
    const trimmed = content.trim();
    if (!trimmed) continue;
    const embedding = await createEmbedding(trimmed);
    const id = crypto.randomUUID();
    const vec = vectorLiteral(embedding);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AiKnowledgeChunk" ("id", "documentId", "content", "embedding", "createdAt", "updatedAt")
       VALUES ($1::text, $2::text, $3::text, $4::vector, NOW(), NOW())`,
      id,
      documentId,
      trimmed,
      vec,
    );
  }
}

export async function embedDocumentFromBody(documentId: string, body: string, title: string): Promise<number> {
  const header = title.trim() ? `# ${title.trim()}\n\n` : '';
  const chunks = splitTextIntoChunks(`${header}${body}`);
  await replaceDocumentChunks(documentId, chunks.length ? chunks : [title || '']);
  return chunks.length || 1;
}

export function parseKeywordList(keywords?: string | null): string[] {
  if (!keywords?.trim()) return [];
  return keywords
    .split(/[,،]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export function buildPendingSearchChunkContent(input: {
  title: string;
  questionText: string;
  keywords?: string;
}): string {
  const parts: string[] = [];
  const title = input.title.trim();
  if (title) parts.push(title);
  for (const k of parseKeywordList(input.keywords)) parts.push(k);
  const q = input.questionText.trim();
  if (q) parts.push(q);
  return parts.join('\n');
}

export async function embedPendingAnswerDocument(
  documentId: string,
  input: {
    title: string;
    questionText: string;
    answerText: string;
    keywords?: string;
    fullBody: string;
  },
): Promise<number> {
  const searchChunk = buildPendingSearchChunkContent({
    title: input.title,
    questionText: input.questionText,
    keywords: input.keywords,
  });
  const fullBody = input.fullBody.trim();
  const contents = [searchChunk, fullBody].filter((c) => c.length > 0);
  await replaceDocumentChunks(documentId, contents.length ? contents : [input.title || input.answerText]);
  return contents.length || 1;
}
