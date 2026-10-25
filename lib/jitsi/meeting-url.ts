/** Hostname of our JWT-protected meet (client: set NEXT_PUBLIC_JITSI_DOMAIN). */
export function managedMeetDomain(): string {
  const raw =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_JITSI_DOMAIN) ||
    (typeof process !== 'undefined' && process.env?.JITSI_DOMAIN) ||
    '';
  return String(raw)
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

function parseMeetingUrl(raw: string): URL | null {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

function hostMatchesManagedDomain(host: string, domain: string): boolean {
  const h = host.toLowerCase();
  const d = domain.toLowerCase();
  return h === d || h.endsWith(`.${d}`);
}

/** True when URL points at our meet server (needs a freshly minted JWT, not a saved link). */
export function isManagedJitsiMeetingUrl(videoMeetingUrl: string | null | undefined): boolean {
  const parsed = parseMeetingUrl(String(videoMeetingUrl || ''));
  if (!parsed) return false;
  const host = parsed.hostname.toLowerCase();
  const domain = managedMeetDomain();
  if (domain && hostMatchesManagedDomain(host, domain)) return true;
  /** Build without NEXT_PUBLIC_JITSI_DOMAIN — still avoid stale meet links */
  if (!domain && host === 'meet.pasteur-plus.com') return true;
  return false;
}

/**
 * Operator "external" link only when it is a real third-party meet URL.
 * Saved pasteur meet links without JWT must not bypass token minting.
 */
export function isExternalConsultationMeetingUrl(
  videoMeetingUrl: string | null | undefined,
): boolean {
  const url = String(videoMeetingUrl || '').trim();
  if (!url) return false;
  if (isManagedJitsiMeetingUrl(url)) return false;
  return true;
}
