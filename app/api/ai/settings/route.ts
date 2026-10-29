import { jsonError } from '@/lib/auth/api-utils';
import { getAiSettings } from '@/lib/ai/settings';
import { NextResponse } from 'next/server';

export async function GET() {
  const settings = await getAiSettings();
  return NextResponse.json({
    voiceMaxSeconds: settings.voiceMaxSeconds,
    similarityThreshold: settings.similarityThreshold,
    retrievalTopK: settings.retrievalTopK,
    preferredProvider: settings.preferredProvider,
  });
}

export async function PATCH(request: Request) {
  return jsonError('تنظیمات از پنل ادمین قابل تغییر است.', 405);
}
