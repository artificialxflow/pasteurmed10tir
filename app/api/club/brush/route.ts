import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { assertClubPhoneWriteAccess } from '@/lib/club/access';
import {
  getBrushStatus,
  mapClubProfile,
  recordBrush,
} from '@/lib/club/service';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await parseJson<{ phone?: string }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhoneDigits(String(body.phone || ''));
  if (!phone || phone.length < 10) {
    return jsonError('شماره موبایل معتبر نیست.');
  }

  const access = await assertClubPhoneWriteAccess(phone);
  if (!access.ok) return access.error;

  const result = await recordBrush(phone);
  if (!result.ok) return jsonError(result.error);

  return NextResponse.json({
    profile: mapClubProfile(result.profile),
    brushStatus: getBrushStatus(result.profile.brushHistory),
  });
}
