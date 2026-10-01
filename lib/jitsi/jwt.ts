import { createHmac } from 'crypto';
import { getJitsiConfig } from '@/lib/jitsi/config';

export type MintJitsiJwtInput = {
  room: string;
  sub: string;
  displayName: string;
  moderator: boolean;
  /** Lifetime in seconds (default 2h). */
  ttlSeconds?: number;
};

export type MintedJitsiJwt = {
  room: string;
  jwt: string;
  url: string;
  expiresAt: string;
  expiresAtUnix: number;
};

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** Patient toolbar — no recording / livestream tools. */
const PATIENT_TOOLBAR = [
  'microphone',
  'camera',
  'hangup',
  'chat',
  'settings',
  'raisehand',
  'tileview',
  'filmstrip',
  'fullscreen',
  'fodeviceselection',
  'videoquality',
];

function patientJoinHash(): string {
  return `#config.toolbarButtons=${encodeURIComponent(
    JSON.stringify(PATIENT_TOOLBAR),
  )}&config.disableDeepLinking=true`;
}

/** HS256 JWT for docker-jitsi-meet AUTH_TYPE=jwt — never put APP_SECRET in query. */
export function mintJitsiJwt(input: MintJitsiJwtInput): MintedJitsiJwt {
  const { domain, appId, appSecret } = getJitsiConfig();
  const room = String(input.room || '').trim();
  if (!room) throw new Error('نام اتاق ویدیو نامعتبر است.');

  const ttl = Math.max(300, Math.min(input.ttlSeconds ?? 2 * 60 * 60, 4 * 60 * 60));
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttl;
  const isModerator = Boolean(input.moderator);

  const header = base64urlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = base64urlJson({
    iss: appId,
    aud: appId,
    sub: String(input.sub || 'user').slice(0, 128),
    room,
    moderator: isModerator,
    nbf: now - 10,
    exp,
    context: {
      user: {
        name: String(input.displayName || 'کاربر').slice(0, 80),
      },
      features: isModerator
        ? {
            recording: true,
            livestreaming: true,
          }
        : {
            /** بیمار: ضبط جلسه / صفحه غیرفعال */
            recording: false,
            livestreaming: false,
            'outbound-call': false,
            transcription: false,
          },
    },
  });

  const signature = createHmac('sha256', appSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const jwt = `${header}.${payload}.${signature}`;
  let url = `https://${domain}/${encodeURIComponent(room)}?jwt=${encodeURIComponent(jwt)}`;
  if (!isModerator) {
    url += patientJoinHash();
  }

  return {
    room,
    jwt,
    url,
    expiresAt: new Date(exp * 1000).toISOString(),
    expiresAtUnix: exp,
  };
}
