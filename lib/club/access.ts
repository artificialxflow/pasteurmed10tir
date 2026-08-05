import { jsonError } from '@/lib/auth/api-utils';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import {
  assertPhoneAccess,
  optionalPatient,
} from '@/lib/operations/require-patient';
import type { NextResponse } from 'next/server';

export async function assertClubPhoneWriteAccess(
  phone: string,
): Promise<{ ok: true } | { ok: false; error: NextResponse }> {
  const key = normalizePhoneDigits(phone);
  const session = await optionalPatient();
  if (session && !assertPhoneAccess(session, key)) {
    return { ok: false, error: jsonError('دسترسی ندارید.', 403) };
  }
  return { ok: true };
}
