import { listOccupiedDoctorVisitSlots } from '@/lib/consultation/doctor-slots';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const date = String(searchParams.get('date') || '').trim();
  if (!date) {
    return NextResponse.json({ error: 'تاریخ الزامی است.' }, { status: 400 });
  }
  const slots = await listOccupiedDoctorVisitSlots({ doctorId: id, date });
  return NextResponse.json({ slots });
}
