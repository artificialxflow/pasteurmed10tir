import { listFollowUpDoctorNames, parseFollowUpServiceCategory } from '@/lib/admin/follow-up-doctors';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = await requireAdmin('followUp');
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const serviceCategory = parseFollowUpServiceCategory(searchParams.get('serviceCategory'));
  const names = await listFollowUpDoctorNames(serviceCategory);
  return NextResponse.json({ serviceCategory, names });
}
