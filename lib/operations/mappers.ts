import type {
  Booking,
  BookingStatus,
  Complaint,
  ComplaintStatus,
  Consultation,
  ConsultationStatus,
  DoctorReview,
  InsuranceInquiry,
  InsuranceInquiryStatus,
  PartnerRequest,
  PartnerRequestStatus,
  Reminder,
  ReminderStatus,
  ReviewStatus,
} from '@prisma/client';

export function generateOperationId(): string {
  return `PST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function mapBooking(row: Booking) {
  return {
    id: row.id,
    doctorId: row.doctorId ?? undefined,
    doctorName: row.doctorName ?? undefined,
    specialty: row.specialty ?? undefined,
    type: row.type ?? undefined,
    typeLabel: row.typeLabel ?? undefined,
    day: row.day ?? undefined,
    timeValue: row.timeValue ?? undefined,
    timeLabel: row.timeLabel ?? undefined,
    patientName: row.patientName ?? undefined,
    patientPhone: row.patientPhone,
    amount: row.amount,
    isDeposit: row.isDeposit,
    depositNonRefundable: row.depositNonRefundable,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    dateLabel: row.dateLabel ?? undefined,
    referralCode: row.referralCode ?? undefined,
  };
}

export function mapConsultation(row: Consultation) {
  return {
    id: row.id,
    type: row.type ?? undefined,
    typeLabel: row.typeLabel ?? undefined,
    category: row.category ?? undefined,
    categoryLabel: row.categoryLabel ?? undefined,
    specialty: row.specialty ?? undefined,
    specialtyLabel: row.specialtyLabel ?? undefined,
    doctorId: row.doctorId ?? undefined,
    doctorName: row.doctorName ?? undefined,
    name: row.patientName ?? undefined,
    phone: row.patientPhone,
    description: row.description ?? undefined,
    estimate: row.estimate ?? undefined,
    amount: row.amount,
    priceSource: row.priceSource ?? undefined,
    hasImage: row.hasImage,
    onlineInsuranceCovered: row.onlineInsuranceCovered,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapInsuranceInquiry(row: InsuranceInquiry) {
  return {
    id: row.id,
    phone: row.patientPhone,
    patientName: row.patientName ?? undefined,
    mode: row.mode,
    baseInsuranceId: row.baseInsuranceId ?? undefined,
    complementaryInsuranceId: row.complementaryInsuranceId ?? undefined,
    franchisePercent: row.franchisePercent,
    visitFee: row.visitFee,
    depositAmount: row.depositAmount,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
  };
}

export function mapReminder(row: Reminder) {
  return {
    id: row.id,
    bookingId: row.bookingId ?? undefined,
    patientName: row.patientName ?? undefined,
    patientPhone: row.patientPhone,
    doctorName: row.doctorName ?? undefined,
    day: row.day ?? undefined,
    timeLabel: row.timeLabel ?? undefined,
    typeLabel: row.typeLabel ?? undefined,
    optionId: row.optionId ?? undefined,
    optionLabel: row.optionLabel ?? undefined,
    status: row.status,
    notified: row.notified,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapDoctorReview(row: DoctorReview) {
  return {
    id: row.id,
    doctorId: row.doctorId,
    doctorName: row.doctorName,
    doctorKind: row.doctorKind as 'dental' | 'medical',
    phone: row.patientPhone,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapComplaint(row: Complaint) {
  return {
    id: row.id,
    name: row.patientName,
    phone: row.patientPhone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapPartnerRequest(row: PartnerRequest) {
  return {
    id: row.id,
    type: row.type,
    typeLabel: row.typeLabel ?? undefined,
    name: row.patientName,
    phone: row.patientPhone,
    specialty: row.specialty ?? undefined,
    city: row.city ?? undefined,
    description: row.description ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export type BookingStatusValue = BookingStatus;
export type ConsultationStatusValue = ConsultationStatus;
export type InquiryStatusValue = InsuranceInquiryStatus;
export type ReviewStatusValue = ReviewStatus;
export type ComplaintStatusValue = ComplaintStatus;
export type PartnerStatusValue = PartnerRequestStatus;
export type ReminderStatusValue = ReminderStatus;
