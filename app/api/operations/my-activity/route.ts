import {
  mapBooking,
  mapConsultation,
  mapInsuranceInquiry,
} from '@/lib/operations/mappers';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const phone = auth.session.phone;

  const [bookings, inquiries, consultations] = await Promise.all([
    prisma.booking.findMany({
      where: { patientPhone: phone },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.insuranceInquiry.findMany({
      where: { patientPhone: phone },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.consultation.findMany({
      where: { patientPhone: phone },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    bookings: bookings.map(mapBooking),
    insuranceInquiries: inquiries.map(mapInsuranceInquiry),
    consultations: consultations.map(mapConsultation),
  });
}
