import { mapShopOrder } from '@/lib/commerce/mappers';
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

  const [bookings, inquiries, consultations, shopOrders] = await Promise.all([
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
    prisma.shopOrder.findMany({
      where: {
        OR: [{ customerPhone: phone }, { userId: auth.session.userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
  ]);

  return NextResponse.json({
    bookings: bookings.map(mapBooking),
    insuranceInquiries: inquiries.map(mapInsuranceInquiry),
    consultations: consultations.map(mapConsultation),
    shopOrders: shopOrders.map(mapShopOrder),
  });
}
