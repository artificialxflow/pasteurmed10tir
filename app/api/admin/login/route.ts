import { verifyAdminCredentials } from '@/lib/auth/admin-db';
import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { setAdminSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

type Body = { username?: string; password?: string };

export async function POST(request: Request) {
  const body = await parseJson<Body>(request);
  if (!body?.username || !body?.password) {
    return jsonError('نام کاربری و رمز عبور الزامی است.');
  }

  const session = await verifyAdminCredentials(body.username, body.password);
  if (!session) {
    return jsonError('نام کاربری یا رمز عبور اشتباه است، یا حساب غیرفعال است.', 401);
  }

  await setAdminSession({ adminUserId: session.userId });
  return NextResponse.json({ session });
}
