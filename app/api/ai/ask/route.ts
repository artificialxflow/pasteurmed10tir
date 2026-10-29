import { jsonError } from '@/lib/auth/api-utils';
import { AiClientError, createEmbedding } from '@/lib/ai/client';
import { resolveAiConfig, aiConfigured } from '@/lib/ai/config';
import { clientRateLimitKey, checkRateLimit } from '@/lib/ai/rate-limit';
import {
  answerFromRetrieval,
  enqueuePendingQuestion,
  retrieveChunks,
} from '@/lib/ai/rag';
import { getAiSettings } from '@/lib/ai/settings';
import { NextResponse } from 'next/server';

type AskBody = {
  question?: string;
  sessionId?: string;
  userId?: string;
  organizationId?: string;
};

export async function POST(request: Request) {
  const limitKey = clientRateLimitKey(request, 'ai-ask');
  if (!checkRateLimit(limitKey, 20, 60_000)) {
    return jsonError('تعداد درخواست زیاد است — یک دقیقه بعد دوباره تلاش کنید.', 429);
  }

  const config = resolveAiConfig();
  if (!aiConfigured(config)) {
    return jsonError('دستیار هوشمند موقتاً در دسترس نیست.', 503);
  }

  let body: AskBody;
  try {
    body = (await request.json()) as AskBody;
  } catch {
    return jsonError('بدنه درخواست نامعتبر است.', 400);
  }

  const question = body.question?.trim();
  if (!question || question.length < 2) {
    return jsonError('لطفاً سوال خود را بنویسید.', 400);
  }
  if (question.length > 4000) {
    return jsonError('سوال خیلی طولانی است.', 400);
  }

  try {
    const settings = await getAiSettings();
    const embedding = await createEmbedding(question, config);
    const chunks = await retrieveChunks(embedding, {
      organizationId: body.organizationId || null,
    });

    const best = chunks[0];
    const hasMatch = best && Number(best.distance) <= settings.similarityThreshold;

    if (!hasMatch) {
      const pending = await enqueuePendingQuestion({
        questionText: question,
        userId: body.userId,
        sessionId: body.sessionId,
        organizationId: body.organizationId,
      });
      return NextResponse.json({
        answer:
          'در دانش رسمی سایت پاسخ آماده‌ای برای این سوال نداریم. سوال شما ثبت شد تا تیم پاستور پلاس بررسی و پاسخ را به دانش سایت اضافه کند. می‌توانید از بخش پشتیبانی هم پیگیری کنید.',
        matched: false,
        pendingId: pending.id,
      });
    }

    const answer = await answerFromRetrieval(question, chunks);
    return NextResponse.json({
      answer,
      matched: true,
      sources: chunks.map((c) => ({ title: c.documentTitle, distance: c.distance })),
    });
  } catch (err) {
    if (err instanceof AiClientError) {
      return jsonError(err.message, err.status);
    }
    console.error('[ai/ask]', err);
    return jsonError('خطا در پردازش سوال.', 500);
  }
}
