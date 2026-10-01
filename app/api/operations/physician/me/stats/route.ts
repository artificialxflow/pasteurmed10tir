import { findPhysicianByPhone } from '@/lib/home-visit/service';
import { mapPhysicianPanel, physicianWorkStats } from '@/lib/physician/panel';
import { requirePatient } from '@/lib/operations/require-patient';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const physician = await findPhysicianByPhone(auth.session.phone);
  if (!physician) return NextResponse.json({ item: null, stats: null });

  const stats = await physicianWorkStats(physician.id);
  return NextResponse.json({ item: mapPhysicianPanel(physician), stats });
}
