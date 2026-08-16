import { jsonError } from '@/lib/auth/api-utils';
import { addClubPoints, mapClubProfile } from '@/lib/club/service';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: { phone?: string; points?: number; reason?: string };
  try {
    body = (await request.json()) as { phone?: string; points?: number; reason?: string };
  } catch {
    return jsonError('درخواست نامعتبر است.');
  }

  const phone = normalizePhoneDigits(String(body.phone || ''));
  const points = Number(body.points || 0);
  const reason = String(body.reason || '').trim();
  if (!phone || phone.length < 10) return jsonError('شماره موبایل معتبر نیست.');
  if (!Number.isFinite(points) || points <= 0) return jsonError('امتیاز نامعتبر است.');
  if (!reason) return jsonError('دلیل امتیاز الزامی است.');

  const profile = await addClubPoints(phone, points, reason);
  if (!profile) return jsonError('ثبت امتیاز ناموفق.', 400);

  return NextResponse.json({ profile: mapClubProfile(profile) });
}
