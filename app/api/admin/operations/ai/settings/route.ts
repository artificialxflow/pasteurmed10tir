import { jsonError } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { getAiSettings, updateAiSettings } from '@/lib/ai/settings';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  const settings = await getAiSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('aiKnowledge');
  if (auth.error) return auth.error;

  let body: {
    voiceMaxSeconds?: number;
    similarityThreshold?: number;
    retrievalTopK?: number;
    preferredProvider?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError('بدنه نامعتبر است.', 400);
  }

  if (body.voiceMaxSeconds !== undefined && (body.voiceMaxSeconds < 30 || body.voiceMaxSeconds > 600)) {
    return jsonError('سقف صوت باید بین ۳۰ و ۶۰۰ ثانیه باشد.', 400);
  }

  const updated = await updateAiSettings(body);
  return NextResponse.json(updated);
}
