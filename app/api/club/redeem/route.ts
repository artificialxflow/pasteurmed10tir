import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { assertClubPhoneWriteAccess } from '@/lib/club/access';
import { mapClubProfile, redeemReward } from '@/lib/club/service';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await parseJson<{
    phone?: string;
    reward?: { id?: string | number; title?: string; points?: number; emoji?: string };
  }>(request);
  if (!body?.reward?.title || body.reward.points == null) {
    return jsonError('اطلاعات پاداش ناقص است.');
  }

  const phone = normalizePhoneDigits(String(body.phone || ''));
  if (!phone || phone.length < 10) {
    return jsonError('شماره موبایل معتبر نیست.');
  }

  const access = await assertClubPhoneWriteAccess(phone);
  if (!access.ok) return access.error;

  const result = await redeemReward(phone, {
    id: body.reward.id ?? body.reward.title,
    title: String(body.reward.title),
    points: Number(body.reward.points),
    emoji: body.reward.emoji,
  });

  if (!result.ok) return jsonError(result.error);

  return NextResponse.json({ profile: mapClubProfile(result.profile) });
}
