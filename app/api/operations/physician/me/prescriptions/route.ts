import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { findPhysicianByPhone } from '@/lib/home-visit/service';
import { createHealthEntryForPhone } from '@/lib/health-record/service';
import { notifyHealthRecordEntrySms } from '@/lib/health-record/sms';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/** ثبت نسخه در پرونده سلامت بیمار توسط پزشک لاگین‌شده */
export async function POST(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const physician = await findPhysicianByPhone(auth.session.phone);
  if (!physician) return jsonError('دسترسی پزشک یافت نشد.', 403);

  const body = await parseJson<{
    consultationId?: string;
    patientPhone?: string;
    medications?: string;
    dosageSchedule?: string;
    diagnosis?: string;
    recommendations?: string;
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  let patientPhone = String(body.patientPhone || '').trim();
  let consultationNote = '';

  if (body.consultationId) {
    const consultation = await prisma.consultation.findUnique({
      where: { id: String(body.consultationId) },
    });
    if (!consultation) return jsonError('مشاوره یافت نشد.', 404);
    if (String(consultation.doctorId || '') !== String(physician.id)) {
      return jsonError('این ویزیت متعلق به شما نیست.', 403);
    }
    if (consultation.status === 'cancelled') {
      return jsonError('مشاوره لغو شده است.');
    }
    patientPhone = consultation.patientPhone;
    consultationNote = [
      consultation.typeLabel ? `نوع: ${consultation.typeLabel}` : '',
      consultation.specialtyLabel ? `تخصص: ${consultation.specialtyLabel}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  if (!patientPhone) return jsonError('موبایل بیمار الزامی است.');
  const medications = String(body.medications || '').trim();
  if (!medications) return jsonError('متن دارو / نسخه الزامی است.');

  try {
    const item = await createHealthEntryForPhone({
      patientPhone,
      section: 'prescription',
      date: new Date().toISOString().slice(0, 10),
      payload: {
        doctorName: physician.name,
        medications,
        dosageSchedule: String(body.dosageSchedule || '').trim() || undefined,
        diagnosis: String(body.diagnosis || '').trim() || undefined,
        recommendations: String(body.recommendations || '').trim() || undefined,
        consultationId: body.consultationId ? String(body.consultationId) : undefined,
        consultationNote: consultationNote || undefined,
      },
      createdByAdminId: auth.session.userId,
    });
    void notifyHealthRecordEntrySms({ patientPhone, section: 'prescription' });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return jsonError(
      e instanceof Error
        ? e.message
        : 'ثبت نسخه ناموفق بود. بیمار باید با همین موبایل حساب داشته باشد.',
      400,
    );
  }
}
