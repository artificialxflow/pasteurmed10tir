import { loadMembershipPlansFromDb } from '@/lib/membership/server-plans';
import { NextResponse } from 'next/server';

export async function GET() {
  const items = await loadMembershipPlansFromDb();
  return NextResponse.json({ items });
}
