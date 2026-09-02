/** Client-side fetch helpers for operations API (Phase 3). */

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

export async function fetchPublicOps<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  return parseJson<T>(res);
}

export async function fetchPatientOps<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  return parseJson<T>(res);
}

export async function postPatientOps<T>(path: string, body: unknown): Promise<T> {
  return fetchPatientOps<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function patchPatientOps<T>(path: string, body: unknown): Promise<T> {
  return fetchPatientOps<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postPublicOps<T>(path: string, body: unknown): Promise<T> {
  return fetchPublicOps<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchAdminOps<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  return parseJson<T>(res);
}

export async function patchAdminOps<T>(path: string, body: unknown): Promise<T> {
  return fetchAdminOps<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postAdminOps<T>(path: string, body: unknown): Promise<T> {
  return fetchAdminOps<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteAdminOps<T = { ok: boolean }>(path: string): Promise<T> {
  const res = await fetch(path, { method: 'DELETE', credentials: 'include' });
  return parseJson<T>(res);
}

export async function downloadAdminOpsExport(path: string, filename: string): Promise<void> {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    let message = `خطا (${res.status})`;
    try {
      const data = JSON.parse(text) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function checkBookingSlot(params: {
  doctorId: string | number;
  type: string;
  timeValue: string | number;
  appointmentDate?: string;
  day?: string;
}): Promise<boolean> {
  const q = new URLSearchParams({
    doctorId: String(params.doctorId),
    type: params.type,
    timeValue: String(params.timeValue),
  });
  if (params.appointmentDate) {
    q.set('date', params.appointmentDate);
  } else if (params.day) {
    q.set('day', params.day);
  }
  const data = await fetchPublicOps<{ taken: boolean }>(
    `/api/operations/bookings/slot-check?${q}`,
  );
  return data.taken;
}

export async function createBookingApi(body: Record<string, unknown>) {
  return postPublicOps<{ booking: Record<string, unknown> }>(
    '/api/operations/bookings',
    body,
  );
}

export async function createConsultationApi(body: Record<string, unknown>) {
  return postPublicOps<{ item: Record<string, unknown> }>(
    '/api/operations/consultations',
    body,
  );
}

export async function createInsuranceInquiryApi(body: Record<string, unknown>) {
  return postPublicOps<{ inquiry: Record<string, unknown> }>(
    '/api/operations/insurance-inquiries',
    body,
  );
}

export async function getInsuranceInquiryApi(id: string) {
  return fetchPatientOps<{ inquiry: Record<string, unknown> }>(
    `/api/operations/insurance-inquiries/${encodeURIComponent(id)}`,
  );
}

export type MyActivityResponse = {
  bookings: Array<Record<string, unknown>>;
  insuranceInquiries: Array<Record<string, unknown>>;
  consultations: Array<Record<string, unknown>>;
  shopOrders: Array<Record<string, unknown>>;
};

export async function fetchMyActivityApi() {
  return fetchPatientOps<MyActivityResponse>('/api/operations/my-activity');
}

export async function getConsultationApi(id: string) {
  return fetchPatientOps<{ item: Record<string, unknown> }>(
    `/api/operations/consultations/${encodeURIComponent(id)}`,
  );
}
