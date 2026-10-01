import { listPhysicianCommissions } from '@/lib/physician/panel';
import { requirePatient } from '@/lib/operations/require-patient';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const result = await listPhysicianCommissions(auth.session.phone);
  return NextResponse.json(result);
}
