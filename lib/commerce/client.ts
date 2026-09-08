/** Client-side fetch helpers for commerce API (Phase 4). */

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

export async function fetchPublicCommerce<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  return parseJson<T>(res);
}

export async function fetchPatientCommerce<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  return parseJson<T>(res);
}

export async function postPublicCommerce<T>(path: string, body: unknown): Promise<T> {
  return fetchPublicCommerce<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postPatientCommerce<T>(path: string, body: unknown): Promise<T> {
  return fetchPatientCommerce<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchAdminCommerce<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  return parseJson<T>(res);
}

export async function putAdminCommerce<T>(path: string, body: unknown): Promise<T> {
  return fetchAdminCommerce<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function patchAdminCommerce<T>(path: string, body: unknown): Promise<T> {
  return fetchAdminCommerce<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteAdminCommerce<T = { ok: boolean; message?: string }>(
  path: string,
): Promise<T> {
  return fetchAdminCommerce<T>(path, { method: 'DELETE' });
}

export async function postAdminCommerce<T>(path: string, body?: unknown): Promise<T> {
  return fetchAdminCommerce<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function downloadAdminCommerceExport(path: string, filename: string): Promise<void> {
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

export async function getMembershipPlansApi() {
  return fetchPublicCommerce<{ items: import('@/lib/data').Membership[] }>(
    '/api/commerce/membership-plans',
  );
}

export async function lookupVisitorApi(code: string) {
  return fetchPublicCommerce<{ visitor: import('@/lib/data').Visitor | null }>(
    `/api/commerce/visitors/lookup?code=${encodeURIComponent(code)}`,
  );
}

export async function resolveReferralDiscount(amount: number, referralCode?: string) {
  const { applyReferralDiscount, REFERRAL_CODE_NOT_FOUND } = await import(
    '@/lib/commerce/referral-discount'
  );
  const code = (referralCode || '').trim().toUpperCase();
  if (!code) {
    return { payable: Math.max(0, Math.floor(Number(amount) || 0)) };
  }
  const { visitor } = await lookupVisitorApi(code);
  if (!visitor) {
    return {
      payable: Math.max(0, Math.floor(Number(amount) || 0)),
      error: REFERRAL_CODE_NOT_FOUND,
    };
  }
  const discounted = applyReferralDiscount(amount);
  return {
    payable: discounted.payable,
    referralCode: code,
    referralDiscountPercent: discounted.discountPercent,
    referralDiscountAmount: discounted.discountAmount,
  };
}

export async function createMembershipApplicationApi(body: Record<string, unknown>) {
  return postPublicCommerce<{ application: Record<string, unknown> }>(
    '/api/commerce/membership-applications',
    body,
  );
}

export async function createLoanApplicationApi(body: Record<string, unknown>) {
  return postPatientCommerce<{ application: Record<string, unknown> }>(
    '/api/commerce/loan-applications',
    body,
  );
}

export async function getMyLoanDocumentsApi() {
  return fetchPatientCommerce<{ items: Record<string, unknown>[] }>(
    '/api/commerce/loan-documents',
  );
}

export async function uploadLoanDocumentApi(kind: string, file: File) {
  const form = new FormData();
  form.append('kind', kind);
  form.append('file', file);
  const res = await fetch('/api/commerce/loan-documents', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const text = await res.text();
  let data: { item?: Record<string, unknown>; error?: string };
  try {
    data = JSON.parse(text) as { item?: Record<string, unknown>; error?: string };
  } catch {
    throw new Error(!res.ok ? `خطا (${res.status})` : 'پاسخ نامعتبر از سرور.');
  }
  if (!res.ok) throw new Error(data.error || 'آپلود ناموفق بود.');
  return data;
}

export async function deleteLoanDocumentApi(id: string) {
  return fetchPatientCommerce<{ ok: boolean }>(`/api/commerce/loan-documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function getMyMembershipApplicationsApi() {
  return fetchPatientCommerce<{ items: Record<string, unknown>[] }>(
    '/api/commerce/membership-applications',
  );
}

export async function createCreditActivationApi(body: {
  requestedAmount: number;
  installmentCount?: number;
}) {
  return postPatientCommerce<{ item: Record<string, unknown> }>(
    '/api/commerce/credit-activation',
    body,
  );
}

export async function getMyCreditActivationApi() {
  return fetchPatientCommerce<{ items: Record<string, unknown>[] }>(
    '/api/commerce/credit-activation',
  );
}

export async function completeMembershipPaymentApi(body: Record<string, unknown>) {
  return postPublicCommerce<{ member: Record<string, unknown> }>(
    '/api/commerce/payments/membership',
    body,
  );
}

export async function completeShopVipPaymentApi(body: Record<string, unknown>) {
  return postPublicCommerce<{ application: Record<string, unknown> }>(
    '/api/commerce/payments/shop-vip',
    body,
  );
}

export async function createShopOrderApi(body: Record<string, unknown>) {
  return postPublicCommerce<{ order: Record<string, unknown> }>(
    '/api/commerce/orders',
    body,
  );
}

export async function createFacilityRequestApi(body: Record<string, unknown>) {
  return postPublicCommerce<{ item: Record<string, unknown> }>(
    '/api/commerce/facilities',
    body,
  );
}

export async function getWalletApi(phone?: string) {
  const q = phone ? `?phone=${encodeURIComponent(phone)}` : '';
  return fetchPatientCommerce<{ wallet: import('@/lib/wallet').Wallet; settings: import('@/lib/wallet').WalletSettings }>(
    `/api/commerce/wallet${q}`,
  );
}

export async function getInstallmentsApi() {
  return fetchPatientCommerce<{ items: import('@/lib/patient').InstallmentPlan[] }>(
    '/api/commerce/installments',
  );
}

export async function checkShopVipApi(phone: string) {
  return fetchPublicCommerce<{ vip: boolean }>(
    `/api/commerce/shop-vip?phone=${encodeURIComponent(phone)}`,
  );
}
