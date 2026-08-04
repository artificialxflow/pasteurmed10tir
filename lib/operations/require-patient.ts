import { jsonError } from '@/lib/auth/api-utils';
import { getPatientSession } from '@/lib/auth/session';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import type { NextResponse } from 'next/server';

export type PatientSessionInfo = {
  userId: string;
  phone: string;
};

type PatientResult =
  | { session: PatientSessionInfo; error?: never }
  | { session?: never; error: NextResponse };

export async function requirePatient(): Promise<PatientResult> {
  const payload = await getPatientSession();
  if (!payload) return { error: jsonError('وارد نشده‌اید.', 401) };
  const phone = normalizePhoneDigits('phone' in payload ? String(payload.phone) : '');
  if (!phone) return { error: jsonError('نشست نامعتبر است.', 401) };
  return { session: { userId: payload.userId, phone } };
}

export async function optionalPatient(): Promise<PatientSessionInfo | null> {
  const payload = await getPatientSession();
  if (!payload) return null;
  return { userId: payload.userId, phone: normalizePhoneDigits(payload.phone) };
}

export function phonesMatch(a: string, b: string): boolean {
  return normalizePhoneDigits(a) === normalizePhoneDigits(b);
}

export function assertPhoneAccess(
  session: PatientSessionInfo | null,
  resourcePhone: string,
): boolean {
  if (!session) return false;
  return phonesMatch(session.phone, resourcePhone);
}
