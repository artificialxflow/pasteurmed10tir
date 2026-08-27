import { addClubPoints } from '@/lib/club/service';
import { generateOperationId, mapConsultation } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { isSmsConfigured, sendConsultationSms } from '@/lib/sms/client';

export type CreateConsultationInput = {
  type?: string;
  typeLabel?: string;
  category?: string;
  categoryLabel?: string;
  specialty?: string;
  specialtyLabel?: string;
  doctorId?: string | number | null;
  doctorName?: string;
  patientName?: string;
  patientPhone?: string;
  description?: string;
  estimate?: string;
  amount?: number;
  priceSource?: string;
  hasImage?: boolean;
  onlineInsuranceCovered?: boolean;
  preferredDate?: string;
  preferredDateLabel?: string;
  preferredTime?: string;
  preferredTimeLabel?: string;
};

export async function createConsultationRecord(body: CreateConsultationInput) {
  const patientPhone = normalizePhoneDigits(String(body.patientPhone || ''));
  if (!patientPhone || patientPhone.length < 10) {
    throw new Error('شماره موبایل معتبر نیست.');
  }

  const patientName = String(body.patientName || '').trim();
  if (!patientName) throw new Error('نام را وارد کنید.');

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const row = await prisma.consultation.create({
    data: {
      id: generateOperationId(),
      userId,
      patientPhone,
      patientName,
      type: body.type ? String(body.type) : null,
      typeLabel: body.typeLabel ? String(body.typeLabel) : null,
      category: body.category ? String(body.category) : null,
      categoryLabel: body.categoryLabel ? String(body.categoryLabel) : null,
      specialty: body.specialty ? String(body.specialty) : null,
      specialtyLabel: body.specialtyLabel ? String(body.specialtyLabel) : null,
      doctorId: body.doctorId != null ? String(body.doctorId) : null,
      doctorName: body.doctorName ? String(body.doctorName) : null,
      description: body.description ? String(body.description) : null,
      estimate: body.estimate ? String(body.estimate) : null,
      amount: Number(body.amount || 0),
      priceSource: body.priceSource ? String(body.priceSource) : null,
      hasImage: Boolean(body.hasImage),
      onlineInsuranceCovered: Boolean(body.onlineInsuranceCovered),
      preferredDate: body.preferredDate ? String(body.preferredDate) : null,
      preferredDateLabel: body.preferredDateLabel ? String(body.preferredDateLabel) : null,
      preferredTime: body.preferredTime ? String(body.preferredTime) : null,
      preferredTimeLabel: body.preferredTimeLabel ? String(body.preferredTimeLabel) : null,
      status: 'pending',
    },
  });

  await addClubPoints(patientPhone, 20, 'مشاوره و ویزیت');

  if (isSmsConfigured()) {
    try {
      const recent = await prisma.consultation.count({
        where: {
          patientPhone,
          createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
          id: { not: row.id },
        },
      });
      if (recent === 0) {
        await sendConsultationSms(patientPhone, row.id);
      }
    } catch (e) {
      console.error('[sms] consultation', e);
    }
  }

  return mapConsultation(row);
}
