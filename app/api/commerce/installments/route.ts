import { mapInstallmentPlan } from '@/lib/commerce/mappers';
import {
  hideMembershipInstallmentPlans,
  listVisibleInstallments,
} from '@/lib/commerce/installment-service';
import { requirePatient } from '@/lib/operations/require-patient';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  await hideMembershipInstallmentPlans(auth.session.phone);
  const rows = await listVisibleInstallments(auth.session.phone);
  return NextResponse.json({ items: rows.map(mapInstallmentPlan) });
}
