export type AiProviderId = 'gapgpt' | 'openai' | 'avalai';

export type AiRuntimeConfig = {
  provider: AiProviderId;
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
};

function trimUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

const DEFAULT_AVALAI_BASE = 'https://api.avalai.ir/v1';
const DEFAULT_GAPGPT_BASE = 'https://api.gapgpt.app/v1';

/** کلید Aval؛ اگر قدیمی در AVALAI_BASE_URL گذاشته شده (aa-...) همان را می‌خواند. */
export function resolveAvalaiApiKey(): string {
  const fromKey = (process.env.AVALAI_API_KEY || '').trim();
  if (fromKey) return fromKey;
  const legacy = (process.env.AVALAI_BASE_URL || '').trim();
  if (legacy.startsWith('aa-')) return legacy;
  return '';
}

export function resolveAvalaiBaseUrl(): string {
  const raw = (process.env.AVALAI_BASE_URL || '').trim();
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return trimUrl(raw);
  }
  return DEFAULT_AVALAI_BASE;
}

export function resolveAiConfig(overrideProvider?: string): AiRuntimeConfig {
  const providerRaw = (overrideProvider || process.env.AI_PROVIDER || 'gapgpt').toLowerCase();
  const chatModel = process.env.AI_CHAT_MODEL || 'gpt-4o-mini';
  const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  if (providerRaw === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY || '';
    return {
      provider: 'openai',
      apiKey,
      baseUrl: trimUrl(process.env.AI_BASE_URL || 'https://api.openai.com/v1'),
      chatModel,
      embeddingModel,
    };
  }

  if (providerRaw === 'avalai') {
    const apiKey = resolveAvalaiApiKey();
    return {
      provider: 'avalai',
      apiKey,
      baseUrl: resolveAvalaiBaseUrl(),
      chatModel,
      embeddingModel,
    };
  }

  const apiKey = process.env.GAPGPT_API_KEY || '';
  return {
    provider: 'gapgpt',
    apiKey,
    baseUrl: trimUrl(process.env.AI_BASE_URL || DEFAULT_GAPGPT_BASE),
    chatModel,
    embeddingModel,
  };
}

/** STT: Aval اگر AVALAI_API_KEY (یا کلید legacy در BASE_URL) باشد؛ وگرنه همان provider چت. */
export function resolveTranscribeConfig(): AiRuntimeConfig {
  if (resolveAvalaiApiKey()) {
    return resolveAiConfig('avalai');
  }
  return resolveAiConfig();
}

export function aiConfigured(config: AiRuntimeConfig): boolean {
  return Boolean(config.apiKey.trim());
}

export const EMBEDDING_DIMENSIONS = 1536;
