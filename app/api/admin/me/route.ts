import { buildAdminSession } from '@/lib/auth/admin-db';
import { getAdminSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export async function GET() {
  const payload = await getAdminSession();
  if (!payload) {
    return NextResponse.json({ session: null }, { status: 401 });
  }
  const session = await buildAdminSession(payload.adminUserId);
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }
  return NextResponse.json({ session });
}
