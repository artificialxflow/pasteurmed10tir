import { generateOperationId } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { isKnownServiceArea } from '@/lib/home-visit/areas';
import { compareByDistance, haversineKm, parseLatLng } from '@/lib/home-visit/geo';
import { parsePreferredGender, parseStaffGender } from '@/lib/home-visit/gender';
import { staffKindForVisit } from '@/lib/home-visit/labels';
import {
  mapFieldStaffAdmin,
  mapFieldStaffPublic,
  mapHomeVisitRequest,
  mapServiceReview,
  mapStaffCommission,
} from '@/lib/home-visit/mappers';
import { notifyHomeVisitStaffAssignedSms, notifyHomeVisitStatusSms } from '@/lib/home-visit/sms';
import {
  canAssignHomeVisit,
  canTransitionHomeVisit,
} from '@/lib/home-visit/transitions';
import type {
  FieldStaffKind,
  FieldStaffStatus,
  HomeVisitKind,
  HomeVisitStatus,
} from '@prisma/client';

const DETAIL_INCLUDE = {
  assignedStaff: true,
  statusEvents: { orderBy: { createdAt: 'asc' as const } },
  serviceReview: true,
} as const;

function normalizeAreas(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item || '').trim()).filter((id) => isKnownServiceArea(id));
}

export async function listFieldStaff(options?: { assignableOnly?: boolean; kind?: FieldStaffKind }) {
  const rows = await prisma.fieldStaff.findMany({
    where: {
      ...(options?.kind ? { kind: options.kind } : {}),
      ...(options?.assignableOnly
        ? { active: true, status: { not: 'inactive' } }
        : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return rows.map(mapFieldStaffAdmin);
}

export async function createFieldStaff(input: {
  name?: string;
  kind?: string;
  phone?: string;
  image?: string;
  specialty?: string;
  serviceAreas?: unknown;
  status?: string;
  active?: boolean;
  sortOrder?: number;
  latitude?: unknown;
  longitude?: unknown;
  gender?: unknown;
  medicalCouncilNumber?: string;
  commissionPercent?: number;
}) {
  const name = String(input.name || '').trim();
  if (name.length < 2) throw new Error('نام نیرو الزامی است.');
  const kind = input.kind === 'physician' ? 'physician' : input.kind === 'nurse' ? 'nurse' : null;
  if (!kind) throw new Error('نوع نیرو نامعتبر است.');
  const gender = parseStaffGender(input.gender);
  if (!gender) throw new Error('جنسیت نیرو (آقا / خانم) الزامی است.');
  const status: FieldStaffStatus =
    input.status === 'busy' || input.status === 'inactive' || input.status === 'available'
      ? input.status
      : 'available';

  const count = await prisma.fieldStaff.count();
  const coords = parseLatLng(input.latitude, input.longitude);
  const row = await prisma.fieldStaff.create({
    data: {
      id: generateOperationId(),
      name,
      kind,
      phone: normalizePhoneDigits(input.phone || '') || String(input.phone || '').trim(),
      image: String(input.image || '').trim(),
      specialty: String(input.specialty || '').trim(),
      medicalCouncilNumber: String(input.medicalCouncilNumber || '').trim(),
      gender,
      commissionPercent: Math.min(100, Math.max(0, Math.round(Number(input.commissionPercent || 0)))),
      serviceAreas: normalizeAreas(input.serviceAreas),
      status,
      active: input.active !== false,
      sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : count,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    },
  });
  return mapFieldStaffAdmin(row);
}

export async function updateFieldStaff(
  id: string,
  input: {
    name?: string;
    kind?: string;
    phone?: string;
    image?: string;
    specialty?: string;
    serviceAreas?: unknown;
    status?: string;
    active?: boolean;
    sortOrder?: number;
    latitude?: unknown;
    longitude?: unknown;
    gender?: unknown;
    medicalCouncilNumber?: string;
    commissionPercent?: number;
  },
) {
  const existing = await prisma.fieldStaff.findUnique({ where: { id } });
  if (!existing) throw new Error('نیرو یافت نشد.');

  const name = input.name != null ? String(input.name).trim() : existing.name;
  if (name.length < 2) throw new Error('نام نیرو الزامی است.');

  let kind: FieldStaffKind = existing.kind;
  if (input.kind === 'physician' || input.kind === 'nurse') kind = input.kind;

  let status: FieldStaffStatus = existing.status;
  if (input.status === 'available' || input.status === 'busy' || input.status === 'inactive') {
    status = input.status;
  }

  const nextGender =
    input.gender !== undefined ? parseStaffGender(input.gender) : existing.gender;
  if (!nextGender) throw new Error('جنسیت نیرو (آقا / خانم) الزامی است.');
  const nextCoords =
    input.latitude !== undefined || input.longitude !== undefined
      ? parseLatLng(input.latitude ?? existing.latitude, input.longitude ?? existing.longitude)
      : parseLatLng(existing.latitude, existing.longitude);
  const row = await prisma.fieldStaff.update({
    where: { id },
    data: {
      name,
      kind,
      phone:
        input.phone != null
          ? normalizePhoneDigits(input.phone) || String(input.phone).trim()
          : existing.phone,
      image: input.image != null ? String(input.image).trim() : existing.image,
      specialty: input.specialty != null ? String(input.specialty).trim() : existing.specialty,
      medicalCouncilNumber:
        input.medicalCouncilNumber != null
          ? String(input.medicalCouncilNumber).trim()
          : existing.medicalCouncilNumber,
      gender: nextGender,
      commissionPercent:
        input.commissionPercent != null && Number.isFinite(Number(input.commissionPercent))
          ? Math.min(100, Math.max(0, Math.round(Number(input.commissionPercent))))
          : existing.commissionPercent,
      serviceAreas: input.serviceAreas != null ? normalizeAreas(input.serviceAreas) : existing.serviceAreas,
      status,
      active: input.active != null ? Boolean(input.active) : existing.active,
      sortOrder:
        input.sortOrder != null && Number.isFinite(Number(input.sortOrder))
          ? Number(input.sortOrder)
          : existing.sortOrder,
      latitude: nextCoords?.lat ?? null,
      longitude: nextCoords?.lng ?? null,
    },
  });
  return mapFieldStaffAdmin(row);
}

export async function deleteFieldStaff(id: string) {
  const existing = await prisma.fieldStaff.findUnique({ where: { id } });
  if (!existing) throw new Error('نیرو یافت نشد.');
  await prisma.fieldStaff.delete({ where: { id } });
  return { ok: true };
}

export async function createHomeVisitRequest(input: {
  kind: HomeVisitKind;
  patientName?: string;
  patientPhone?: string;
  serviceTitle?: string;
  specialtyLabel?: string;
  description?: string;
  patientAddress?: string;
  patientArea?: string;
  amount?: number;
  consultationId?: string | null;
  latitude?: unknown;
  longitude?: unknown;
  preferredGender?: unknown;
}) {
  const patientPhone = normalizePhoneDigits(input.patientPhone || '');
  if (!patientPhone || patientPhone.length < 10) {
    throw new Error('شماره موبایل معتبر نیست.');
  }
  const patientAddress = String(input.patientAddress || '').trim();
  const patientArea = String(input.patientArea || '').trim();
  if (!patientAddress) throw new Error('آدرس منزل الزامی است.');
  if (!isKnownServiceArea(patientArea)) throw new Error('منطقه را از فهرست انتخاب کنید.');

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone ? session.userId : null;
  const coords = parseLatLng(input.latitude, input.longitude);

  const requestId = generateOperationId();
  const row = await prisma.homeVisitRequest.create({
    data: {
      id: requestId,
      userId,
      patientPhone,
      patientName: String(input.patientName || '').trim() || null,
      kind: input.kind,
      serviceTitle: String(input.serviceTitle || '').trim(),
      specialtyLabel: input.specialtyLabel ? String(input.specialtyLabel) : null,
      description: input.description ? String(input.description) : null,
      patientAddress,
      patientArea,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      preferredGender: parsePreferredGender(input.preferredGender),
      amount: Number(input.amount || 0),
      consultationId: input.consultationId || null,
      status: 'submitted',
      statusEvents: {
        create: { id: generateOperationId(), status: 'submitted' },
      },
    },
    include: DETAIL_INCLUDE,
  });
  return mapHomeVisitRequest(row, { includePatientAddress: true });
}

export async function maybeCreateHomeVisitFromPayment(input: {
  kind?: string;
  category?: string;
  patientName?: string;
  patientPhone?: string;
  serviceTitle?: string;
  specialtyLabel?: string;
  description?: string;
  patientAddress?: string;
  patientArea?: string;
  amount?: number;
  consultationId?: string | null;
  latitude?: unknown;
  longitude?: unknown;
  preferredGender?: unknown;
}) {
  const address = String(input.patientAddress || '').trim();
  const area = String(input.patientArea || '').trim();
  if (!address || !isKnownServiceArea(area)) return null;

  const kind: HomeVisitKind | null =
    input.kind === 'nursing'
      ? 'nursing'
      : input.kind === 'consultation' && input.category === 'medical-home'
        ? 'medical_home'
        : input.kind === 'medical_home'
          ? 'medical_home'
          : null;
  if (!kind) return null;

  return createHomeVisitRequest({
    kind,
    patientName: input.patientName,
    patientPhone: input.patientPhone,
    serviceTitle: input.serviceTitle,
    specialtyLabel: input.specialtyLabel,
    description: input.description,
    patientAddress: address,
    patientArea: area,
    amount: input.amount,
    consultationId: input.consultationId,
    latitude: input.latitude,
    longitude: input.longitude,
    preferredGender: input.preferredGender,
  });
}

export async function listNearbyStaff(input: {
  kind: FieldStaffKind;
  latitude?: unknown;
  longitude?: unknown;
  preferredGender?: unknown;
}) {
  const origin = parseLatLng(input.latitude, input.longitude);
  const preferred = parsePreferredGender(input.preferredGender);
  const rows = await prisma.fieldStaff.findMany({
    where: { kind: input.kind, active: true, status: { not: 'inactive' } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return rows
    .filter((row) => preferred === 'any' || row.gender === preferred)
    .map((row) => {
      const staffPoint = parseLatLng(row.latitude, row.longitude);
      return {
        ...mapFieldStaffPublic(row),
        distanceKm: origin && staffPoint ? haversineKm(origin, staffPoint) : null,
      };
    })
    .sort((a, b) => compareByDistance(a.distanceKm, b.distanceKm) || a.name.localeCompare(b.name, 'fa'));
}

export async function listHomeVisitRequests() {
  const rows = await prisma.homeVisitRequest.findMany({
    include: DETAIL_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) => mapHomeVisitRequest(row, { includePatientAddress: true }));
}

export async function listPatientHomeVisits(phone: string) {
  const patientPhone = normalizePhoneDigits(phone);
  if (!patientPhone) return [];
  const rows = await prisma.homeVisitRequest.findMany({
    where: { patientPhone },
    include: DETAIL_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 12,
  });
  return rows.map((row) => mapHomeVisitRequest(row, { includePatientAddress: false }));
}

export async function getPatientHomeVisit(id: string, phone: string) {
  const patientPhone = normalizePhoneDigits(phone);
  const row = await prisma.homeVisitRequest.findFirst({
    where: { id, patientPhone },
    include: DETAIL_INCLUDE,
  });
  if (!row) return null;
  const mapped = mapHomeVisitRequest(row, { includePatientAddress: false });
  const nearbyStaff = row.latitude != null && row.longitude != null
    ? await listNearbyStaff({
        kind: staffKindForVisit(row.kind),
        latitude: row.latitude,
        longitude: row.longitude,
        preferredGender: row.preferredGender,
      })
    : [];
  return { ...mapped, nearbyStaff };
}

export async function assignStaffToHomeVisit(
  requestId: string,
  staffId: string,
  adminUserId?: string | null,
) {
  const request = await prisma.homeVisitRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error('درخواست یافت نشد.');
  if (!canAssignHomeVisit(request.status)) {
    throw new Error('در این مرحله نمی‌توان نیرو را تغییر داد.');
  }

  const staff = await prisma.fieldStaff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.active) throw new Error('نیرو یافت نشد یا غیرفعال است.');
  if (staff.status === 'inactive') throw new Error('این نیرو غیرفعال است.');

  const preferred = parsePreferredGender(request.preferredGender);
  if (preferred !== 'any' && staff.gender !== preferred) {
    throw new Error('این نیرو با ترجیح جنسیتی بیمار هم‌خوان نیست.');
  }

  const expectedKind = staffKindForVisit(request.kind);
  if (staff.kind !== expectedKind) {
    throw new Error(
      request.kind === 'nursing' ? 'برای پرستاری فقط پرستار تخصیص دهید.' : 'برای ویزیت در منزل فقط پزشک تخصیص دهید.',
    );
  }

  const firstAssign = request.status === 'submitted';
  await prisma.$transaction([
    prisma.homeVisitRequest.update({
      where: { id: requestId },
      data: {
        assignedStaffId: staff.id,
        assignedAt: new Date(),
        status: 'staff_assigned',
      },
    }),
    prisma.homeVisitStatusEvent.create({
      data: {
        id: generateOperationId(),
        requestId,
        status: 'staff_assigned',
        adminUserId: adminUserId || null,
      },
    }),
  ]);

  if (firstAssign) {
    await notifyHomeVisitStatusSms(request.patientPhone, 'staff_assigned', requestId);
  }
  await notifyHomeVisitStaffAssignedSms(staff.phone, requestId);

  const row = await prisma.homeVisitRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: DETAIL_INCLUDE,
  });
  return mapHomeVisitRequest(row, { includePatientAddress: true });
}

export async function transitionHomeVisitStatus(
  requestId: string,
  nextStatus: string,
  adminUserId?: string | null,
) {
  const allowed: HomeVisitStatus[] = ['staff_confirmed', 'en_route', 'completed', 'cancelled'];
  if (!allowed.includes(nextStatus as HomeVisitStatus)) {
    throw new Error('وضعیت نامعتبر است.');
  }
  const to = nextStatus as HomeVisitStatus;
  const request = await prisma.homeVisitRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error('درخواست یافت نشد.');
  if (!canTransitionHomeVisit(request.status, to)) {
    throw new Error('پرش بین مراحل مجاز نیست.');
  }
  if (to !== 'cancelled' && to !== 'submitted' && !request.assignedStaffId) {
    throw new Error('ابتدا نیرو را تخصیص دهید.');
  }

  await prisma.$transaction([
    prisma.homeVisitRequest.update({
      where: { id: requestId },
      data: { status: to },
    }),
    prisma.homeVisitStatusEvent.create({
      data: {
        id: generateOperationId(),
        requestId,
        status: to,
        adminUserId: adminUserId || null,
      },
    }),
  ]);

  if (to === 'completed') {
    await upsertStaffCommissionForRequest(requestId);
  }

  await notifyHomeVisitStatusSms(request.patientPhone, to, requestId);

  const row = await prisma.homeVisitRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: DETAIL_INCLUDE,
  });
  return mapHomeVisitRequest(row, { includePatientAddress: true });
}

export async function createHomeVisitReview(input: {
  requestId: string;
  patientPhone: string;
  userId?: string | null;
  rating?: number;
  comment?: string;
}) {
  const patientPhone = normalizePhoneDigits(input.patientPhone);
  const request = await prisma.homeVisitRequest.findFirst({
    where: { id: input.requestId, patientPhone },
    include: { assignedStaff: true, serviceReview: true },
  });
  if (!request) throw new Error('درخواست یافت نشد.');
  if (request.status !== 'completed') throw new Error('امتیاز فقط بعد از انجام خدمت ثبت می‌شود.');
  if (request.serviceReview) throw new Error('برای این درخواست قبلاً امتیاز ثبت شده است.');
  if (!request.assignedStaff) throw new Error('نیروی این درخواست مشخص نیست.');

  const comment = String(input.comment || '').trim();
  if (comment.length < 2) throw new Error('نظر را بنویسید.');
  const rating = Math.min(5, Math.max(1, Number(input.rating || 5)));

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.serviceReview.create({
      data: {
        id: generateOperationId(),
        userId: input.userId || request.userId,
        requestId: request.id,
        patientPhone,
        staffId: request.assignedStaff!.id,
        staffName: request.assignedStaff!.name,
        staffKind: request.assignedStaff!.kind,
        rating,
        comment,
        status: 'pending',
      },
    });
    await tx.homeVisitRequest.update({
      where: { id: request.id },
      data: { status: 'reviewed' },
    });
    await tx.homeVisitStatusEvent.create({
      data: {
        id: generateOperationId(),
        requestId: request.id,
        status: 'reviewed',
      },
    });
    return created;
  });

  return mapServiceReview(review);
}

export async function listServiceReviews() {
  const rows = await prisma.serviceReview.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(mapServiceReview);
}

export async function updateServiceReviewStatus(id: string, status: 'pending' | 'approved' | 'hidden') {
  const row = await prisma.serviceReview.update({ where: { id }, data: { status } });
  return mapServiceReview(row);
}

async function upsertStaffCommissionForRequest(requestId: string) {
  const request = await prisma.homeVisitRequest.findUnique({
    where: { id: requestId },
    include: { assignedStaff: true },
  });
  if (!request?.assignedStaff) return;
  const staff = request.assignedStaff;
  const amount = Math.max(0, Number(request.amount || 0));
  const commissionRate = Math.min(100, Math.max(0, Number(staff.commissionPercent || 0)));
  const commissionAmount = Math.round((amount * commissionRate) / 100);
  await prisma.staffCommission.upsert({
    where: { requestId },
    create: {
      id: generateOperationId(),
      staffId: staff.id,
      staffName: staff.name,
      staffKind: staff.kind,
      requestId,
      amount,
      commissionRate,
      commissionAmount,
    },
    update: {
      staffId: staff.id,
      staffName: staff.name,
      staffKind: staff.kind,
      amount,
      commissionRate,
      commissionAmount,
    },
  });
}

export async function listStaffCommissions(options?: {
  kind?: string;
  from?: string;
  to?: string;
}) {
  const kind = options?.kind === 'physician' || options?.kind === 'nurse' ? options.kind : undefined;
  const fromDate = options?.from ? new Date(options.from) : null;
  const toDate = options?.to ? new Date(options.to) : null;
  const hasFrom = Boolean(fromDate && !Number.isNaN(fromDate.getTime()));
  const hasTo = Boolean(toDate && !Number.isNaN(toDate.getTime()));
  const createdAt =
    hasFrom || hasTo
      ? {
          ...(hasFrom ? { gte: fromDate! } : {}),
          ...(hasTo ? { lte: new Date(toDate!.getTime() + 24 * 60 * 60 * 1000 - 1) } : {}),
        }
      : undefined;

  const rows = await prisma.staffCommission.findMany({
    where: {
      ...(kind ? { staffKind: kind } : {}),
      ...(createdAt ? { createdAt } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  const items = rows.map(mapStaffCommission);
  const total = items.reduce((sum, item) => sum + item.commissionAmount, 0);
  return { items, total };
}

