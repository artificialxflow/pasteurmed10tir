import { clearPatientSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export async function POST() {
  await clearPatientSession();
  return NextResponse.json({ ok: true });
}
