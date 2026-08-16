/** Client-side fetch helpers for club API (Phase 5). */

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`خطا (${res.status})`);
    throw new Error('پاسخ خالی از سرور.');
  }
  let data: T & { error?: string };
  try {
    data = JSON.parse(text) as T & { error?: string };
  } catch {
    throw new Error(!res.ok ? `خطا (${res.status})` : 'پاسخ نامعتبر از سرور.');
  }
  if (!res.ok) throw new Error(data.error || 'خطا در دریافت داده.');
  return data as T;
}

export async function getClubProfileApi(phone: string) {
  const res = await fetch(`/api/club/profile?phone=${encodeURIComponent(phone)}`, {
    credentials: 'include',
  });
  return parseJson<{
    profile: import('@/lib/storage').ClubProfile;
    brushStatus: import('@/lib/storage').BrushStatus;
  }>(res);
}

export async function postClubBrushApi(phone: string) {
  const res = await fetch('/api/club/brush', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return parseJson<{
    profile: import('@/lib/storage').ClubProfile;
    brushStatus: import('@/lib/storage').BrushStatus;
  }>(res);
}

export async function postClubRedeemApi(phone: string, reward: Record<string, unknown>) {
  const res = await fetch('/api/club/redeem', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, reward }),
  });
  return parseJson<{ profile: import('@/lib/storage').ClubProfile }>(res);
}

export async function postClubPointsApi(phone: string, points: number, reason: string) {
  const res = await fetch('/api/club/points', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, points, reason }),
  });
  return parseJson<{ profile: import('@/lib/storage').ClubProfile }>(res);
}
