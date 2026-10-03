import { isConsultationVideoWindowExpired } from '@/lib/jitsi/video-window';

export function videoStatusLabel(status: string | null | undefined): string {
  if (status === 'scheduled') return 'آماده ویزیت تصویری';
  if (status === 'in_call') return 'در حال تماس';
  if (status === 'completed') return 'ویدیو پایان یافت';
  return 'بدون ویدیو';
}

export function canJoinConsultationVideoStatus(status: string | null | undefined): boolean {
  return status === 'scheduled' || status === 'in_call';
}

/** Prefer operator-set meeting URL; otherwise join via minted Jitsi token. */
export function consultationVideoJoinKind(input: {
  videoStatus?: string | null;
  videoMeetingUrl?: string | null;
  videoRoomName?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
}): 'external' | 'jitsi' | 'none' {
  if (!canJoinConsultationVideoStatus(input.videoStatus)) return 'none';
  if (isConsultationVideoWindowExpired(input)) return 'none';
  const url = String(input.videoMeetingUrl || '').trim();
  if (url) return 'external';
  if (input.videoRoomName) return 'jitsi';
  return 'jitsi';
}
