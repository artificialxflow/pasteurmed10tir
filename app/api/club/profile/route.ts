import { jsonError } from '@/lib/auth/api-utils';
import {
  getBrushStatus,
  getOrCreateClubProfile,
  mapClubProfile,
} from '@/lib/club/service';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { NextResponse } from 'next/server';

/** Public read by phone (same UX as prior localStorage club phone entry). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = normalizePhoneDigits(searchParams.get('phone') || '');
  if (!phone || phone.length < 10) {
    return jsonError('شماره موبایل معتبر نیست.');
  }

  const profile = await getOrCreateClubProfile(phone);
  if (!profile) return jsonError('پروفایل باشگاه یافت نشد.', 404);

  return NextResponse.json({
    profile: mapClubProfile(profile),
    brushStatus: getBrushStatus(profile.brushHistory),
  });
}
