/** Client-side fetch helpers for content API (Phase 2). */

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

export async function fetchPublic<T>(path: string): Promise<T> {
  const res = await fetch(path);
  return parseJson<T>(res);
}

export async function fetchAdmin<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  return parseJson<T>(res);
}

export async function putAdmin<T>(path: string, body: unknown): Promise<T> {
  return fetchAdmin<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function uploadAdminImage(file: File): Promise<{ path: string; assetId: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  return parseJson(res);
}
