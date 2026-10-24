import { addClubPoints } from '@/lib/club/service';
import { isDoctorVisitSlotTaken } from '@/lib/consultation/doctor-slots';
import { consultationAllowsImage } from '@/lib/consultation/modality';
import {
  amountsMatchConsultationPrice,
  resolveConsultationPriceServer,
} from '@/lib/consultation/server-pricing';
import { resolveOwnedDependent } from '@/lib/dependents';
import { generateOperationId, mapConsultation } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { consultationSupportsLiveSession } from '@/lib/consultation/modality';
import { notifyDoctorConsultationAssignedSms } from '@/lib/jitsi/doctor-sms';
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
  dependentId?: string | null;
};

export async function createConsultationRecord(body: CreateConsultationInput) {
  const patientPhone = normalizePhoneDigits(String(body.patientPhone || ''));
  if (!patientPhone || patientPhone.length < 10) {
    throw new Error('شماره موبایل معتبر نیست.');
  }

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const requestedDependentId = body.dependentId ? String(body.dependentId) : null;
  const dependent = requestedDependentId
    ? await resolveOwnedDependent(session?.userId, requestedDependentId)
    : null;
  if (requestedDependentId && !dependent) {
    throw new Error('فرد تحت تکفل یافت نشد.');
  }

  const patientName = (dependent?.name || String(body.patientName || '').trim());
  if (!patientName) throw new Error('نام را وارد کنید.');

  if (
    body.doctorId &&
    body.preferredDate &&
    body.preferredTime &&
    (await isDoctorVisitSlotTaken({
      doctorId: String(body.doctorId),
      preferredDate: String(body.preferredDate),
      preferredTime: String(body.preferredTime),
    }))
  ) {
    throw new Error('این ساعت برای این پزشک قبلاً رزرو شده است.');
  }

  const pricing = await resolveConsultationPriceServer({
    specialtyId: body.specialty ? String(body.specialty) : null,
    specialtyName: body.specialtyLabel ? String(body.specialtyLabel) : null,
    typeId: body.type ? String(body.type) : null,
    categoryId: body.category ? String(body.category) : null,
  });
  const clientAmount = Number(body.amount || 0);
  if (pricing.amount < 100) {
    throw new Error('مبلغ مشاوره نامعتبر است.');
  }
  if (!amountsMatchConsultationPrice(clientAmount, pricing.amount)) {
    throw new Error('مبلغ پرداخت با تعرفه فعلی مطابقت ندارد. صفحه را refresh کنید.');
  }

  const row = await prisma.consultation.create({
    data: {
      id: generateOperationId(),
      userId,
      patientPhone,
      patientName,
      dependentId: dependent?.id ?? null,
      type: body.type ? String(body.type) : null,
      typeLabel: body.typeLabel ? String(body.typeLabel) : null,
      category: body.category ? String(body.category) : null,
      categoryLabel: body.categoryLabel ? String(body.categoryLabel) : null,
      specialty: body.specialty ? String(body.specialty) : null,
      specialtyLabel: body.specialtyLabel ? String(body.specialtyLabel) : null,
      doctorId: body.doctorId != null ? String(body.doctorId) : null,
      doctorName: body.doctorName ? String(body.doctorName) : null,
      description: body.description ? String(body.description) : null,
      estimate: pricing.label || (body.estimate ? String(body.estimate) : null),
      amount: pricing.amount,
      priceSource: pricing.source,
      hasImage: Boolean(body.hasImage) && consultationAllowsImage(body.type),
      /** بیمه تکمیلی موقتاً غیرفعال — همیشه false تا پورسانت از کل مبلغ باشد. */
      onlineInsuranceCovered: false,
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

  if (
    row.doctorId &&
    consultationSupportsLiveSession({ category: row.category, type: row.type })
  ) {
    void notifyDoctorConsultationAssignedSms(row.id);
  }

  return mapConsultation(row);
}
