import { prisma } from '@/lib/prisma';

const MS_DAY = 24 * 60 * 60 * 1000;
const GENERAL_RETURN_DAYS = 120;
const SPECIALIST_RETURN_DAYS = 365;

function isGeneralDentalBooking(specialty: string | null | undefined): boolean {
  const s = String(specialty || '').toLowerCase();
  return s.includes('عمومی') || s === 'general' || s.includes('general');
}

export type PatientReturnRateRow = {
  patientPhone: string;
  patientName: string | null;
  tier: 'general' | 'specialist';
  firstVisitAt: string;
  returnVisitAt: string;
  daysBetween: number;
};

export type PatientReturnRateStats = {
  generalReturns: number;
  specialistReturns: number;
  samples: PatientReturnRateRow[];
};

export async function computePatientReturnRateStats(limit = 50): Promise<PatientReturnRateStats> {
  const bookings = await prisma.booking.findMany({
    where: { status: 'confirmed', appointmentAt: { not: null } },
    orderBy: { appointmentAt: 'asc' },
    select: {
      patientPhone: true,
      patientName: true,
      appointmentAt: true,
      specialty: true,
    },
  });

  const byPhone = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const phone = b.patientPhone;
    const list = byPhone.get(phone) || [];
    list.push(b);
    byPhone.set(phone, list);
  }

  const samples: PatientReturnRateRow[] = [];
  let generalReturns = 0;
  let specialistReturns = 0;

  for (const [, list] of byPhone) {
    if (list.length < 2) continue;
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const curr = list[i];
      if (!prev.appointmentAt || !curr.appointmentAt) continue;
      const days = Math.round(
        (curr.appointmentAt.getTime() - prev.appointmentAt.getTime()) / MS_DAY,
      );
      const general = isGeneralDentalBooking(prev.specialty) || isGeneralDentalBooking(curr.specialty);
      const threshold = general ? GENERAL_RETURN_DAYS : SPECIALIST_RETURN_DAYS;
      if (days < threshold || days > threshold * 3) continue;
      const row: PatientReturnRateRow = {
        patientPhone: curr.patientPhone,
        patientName: curr.patientName,
        tier: general ? 'general' : 'specialist',
        firstVisitAt: prev.appointmentAt.toISOString().slice(0, 10),
        returnVisitAt: curr.appointmentAt.toISOString().slice(0, 10),
        daysBetween: days,
      };
      if (general) generalReturns++;
      else specialistReturns++;
      if (samples.length < limit) samples.push(row);
    }
  }

  return { generalReturns, specialistReturns, samples };
}
