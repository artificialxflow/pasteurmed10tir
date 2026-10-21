import { computePatientReturnRateStats } from '@/lib/admin/patient-return-rate';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('dashboard');
  if (auth.error) return auth.error;
  const stats = await computePatientReturnRateStats(100);
  return NextResponse.json(stats);
}
