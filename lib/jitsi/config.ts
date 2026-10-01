export type JitsiServerConfig = {
  domain: string;
  appId: string;
  appSecret: string;
};

export function getJitsiConfig(): JitsiServerConfig {
  const domain = String(process.env.JITSI_DOMAIN || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const appId = String(process.env.JITSI_APP_ID || '').trim();
  const appSecret = String(process.env.JITSI_APP_SECRET || '').trim();

  if (!domain || !appId || !appSecret) {
    throw new Error(
      'تنظیمات ویدیو ناقص است. JITSI_DOMAIN، JITSI_APP_ID و JITSI_APP_SECRET را در Secrets سرور تنظیم کنید.',
    );
  }

  return { domain, appId, appSecret };
}

export function isJitsiConfigured(): boolean {
  try {
    getJitsiConfig();
    return true;
  } catch {
    return false;
  }
}
