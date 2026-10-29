import { aiConfigured, resolveAiConfig, resolveTranscribeConfig, type AiRuntimeConfig } from '@/lib/ai/config';

export class AiClientError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

async function postJson<T>(config: AiRuntimeConfig, path: string, body: unknown): Promise<T> {
  if (!aiConfigured(config)) {
    throw new AiClientError('سرویس هوش مصنوعی پیکربندی نشده است. با پشتیبانی تماس بگیرید.', 503);
  }

  const res = await fetch(`${config.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error?: { message?: string } }).error?.message || res.statusText)
        : res.statusText;
    throw new AiClientError(msg || 'خطا در ارتباط با سرویس هوش مصنوعی', res.status);
  }

  return data as T;
}

type ChatCompletionResponse = {
  choices?: { message?: { content?: string | null } }[];
};

export async function chatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  config = resolveAiConfig(),
): Promise<string> {
  const data = await postJson<ChatCompletionResponse>(config, '/chat/completions', {
    model: config.chatModel,
    messages,
    temperature: 0.2,
  });
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new AiClientError('پاسخی از مدل دریافت نشد.', 502);
  }
  return content.trim();
}

type EmbeddingResponse = {
  data?: { embedding?: number[] }[];
};

export async function createEmbedding(text: string, config = resolveAiConfig()): Promise<number[]> {
  const data = await postJson<EmbeddingResponse>(config, '/embeddings', {
    model: config.embeddingModel,
    input: text,
  });
  const embedding = data.data?.[0]?.embedding;
  if (!embedding?.length) {
    throw new AiClientError('embedding دریافت نشد.', 502);
  }
  return embedding;
}

export async function transcribeAudio(
  file: Blob,
  filename: string,
  config = resolveTranscribeConfig(),
): Promise<string> {
  if (!aiConfigured(config)) {
    throw new AiClientError('سرویس تبدیل گفتار به متن پیکربندی نشده است.', 503);
  }

  const form = new FormData();
  form.append('file', file, filename);
  form.append('model', 'whisper-1');
  form.append('language', 'fa');

  const res = await fetch(`${config.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new AiClientError(text || res.statusText, res.status);
  }

  let parsed: { text?: string } = {};
  try {
    parsed = JSON.parse(text) as { text?: string };
  } catch {
    return text.trim();
  }
  if (!parsed.text?.trim()) {
    throw new AiClientError('متنی از فایل صوتی استخراج نشد.', 502);
  }
  return parsed.text.trim();
}
