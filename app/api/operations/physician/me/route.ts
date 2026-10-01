import { findPhysicianByPhone } from '@/lib/home-visit/service';
import { mapPhysicianPanel } from '@/lib/physician/panel';
import { requirePatient } from '@/lib/operations/require-patient';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const row = await findPhysicianByPhone(auth.session.phone);
  if (!row) return NextResponse.json({ item: null });
  return NextResponse.json({ item: mapPhysicianPanel(row) });
}
