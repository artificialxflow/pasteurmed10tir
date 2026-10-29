import { jsonError } from '@/lib/auth/api-utils';
import { AiClientError, transcribeAudio } from '@/lib/ai/client';
import { aiConfigured, resolveTranscribeConfig } from '@/lib/ai/config';
import { clientRateLimitKey, checkRateLimit } from '@/lib/ai/rate-limit';
import { getAiSettings } from '@/lib/ai/settings';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const limitKey = clientRateLimitKey(request, 'ai-transcribe');
  if (!checkRateLimit(limitKey, 10, 60_000)) {
    return jsonError('تعداد درخواست زیاد است — یک دقیقه بعد دوباره تلاش کنید.', 429);
  }

  const config = resolveTranscribeConfig();
  if (!aiConfigured(config)) {
    return jsonError('تبدیل گفتار به متن موقتاً در دسترس نیست.', 503);
  }

  const settings = await getAiSettings();
  const maxSeconds = settings.voiceMaxSeconds;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('فرم نامعتبر است.', 400);
  }

  const file = form.get('file');
  if (!(file instanceof Blob) || file.size === 0) {
    return jsonError('فایل صوتی ارسال نشده است.', 400);
  }

  const durationRaw = form.get('durationSeconds');
  const durationSeconds =
    typeof durationRaw === 'string' ? Number.parseFloat(durationRaw) : Number(durationRaw);
  if (Number.isFinite(durationSeconds) && durationSeconds > maxSeconds + 1) {
    return jsonError(
      `زمان ضبط بیش از ${maxSeconds} ثانیه مجاز است. لطفاً سوال را کوتاه‌تر بپرسید.`,
      400,
    );
  }

  const maxBytes = Math.max(512_000, maxSeconds * 32_000);
  if (file.size > maxBytes) {
    return jsonError('حجم فایل صوتی بیش از حد مجاز است.', 400);
  }

  try {
    const filename =
      file instanceof File && file.name ? file.name : `voice-${Date.now()}.webm`;
    const text = await transcribeAudio(file, filename, config);
    return NextResponse.json({ text, truncated: false });
  } catch (err) {
    if (err instanceof AiClientError) {
      return jsonError(err.message, err.status);
    }
    console.error('[ai/transcribe]', err);
    return jsonError('خطا در تبدیل گفتار به متن.', 500);
  }
}
