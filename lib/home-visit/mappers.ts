import type { FieldStaff, HomeVisitRequest, HomeVisitStatusEvent, ServiceReview } from '@prisma/client';
import { serviceAreaLabel } from '@/lib/home-visit/areas';

export type FieldStaffPublic = {
  id: string;
  name: string;
  kind: FieldStaff['kind'];
  image: string;
  specialty: string;
};

export type FieldStaffAdmin = FieldStaffPublic & {
  phone: string;
  serviceAreas: string[];
  status: FieldStaff['status'];
  active: boolean;
  sortOrder: number;
  latitude: number | null;
  longitude: number | null;
};

export type NearbyStaff = FieldStaffPublic & {
  distanceKm: number | null;
};

export function mapFieldStaffPublic(row: FieldStaff): FieldStaffPublic {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    image: row.image,
    specialty: row.specialty,
  };
}

export function mapFieldStaffAdmin(row: FieldStaff): FieldStaffAdmin {
  return {
    ...mapFieldStaffPublic(row),
    phone: row.phone,
    serviceAreas: row.serviceAreas,
    status: row.status,
    active: row.active,
    sortOrder: row.sortOrder,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export function mapStatusEvent(row: HomeVisitStatusEvent) {
  return {
    id: row.id,
    status: row.status,
    adminUserId: row.adminUserId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapServiceReview(row: ServiceReview) {
  return {
    id: row.id,
    requestId: row.requestId,
    staffId: row.staffId,
    staffName: row.staffName,
    staffKind: row.staffKind,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    patientPhone: row.patientPhone,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapHomeVisitRequest(
  row: HomeVisitRequest & {
    assignedStaff?: FieldStaff | null;
    statusEvents?: HomeVisitStatusEvent[];
    serviceReview?: ServiceReview | null;
  },
  options?: { includePatientAddress?: boolean },
) {
  const includeAddress = options?.includePatientAddress !== false;
  return {
    id: row.id,
    kind: row.kind,
    serviceTitle: row.serviceTitle,
    specialtyLabel: row.specialtyLabel ?? undefined,
    description: row.description ?? undefined,
    patientName: row.patientName ?? undefined,
    patientPhone: row.patientPhone,
    patientArea: row.patientArea,
    patientAreaLabel: serviceAreaLabel(row.patientArea),
    patientAddress: includeAddress ? row.patientAddress : undefined,
    latitude: includeAddress ? row.latitude ?? undefined : undefined,
    longitude: includeAddress ? row.longitude ?? undefined : undefined,
    hasPatientLocation: row.latitude != null && row.longitude != null,
    amount: row.amount,
    consultationId: row.consultationId ?? undefined,
    status: row.status,
    assignedAt: row.assignedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    assignedStaff: row.assignedStaff ? mapFieldStaffPublic(row.assignedStaff) : null,
    statusEvents: (row.statusEvents || []).map(mapStatusEvent),
    review: row.serviceReview ? mapServiceReview(row.serviceReview) : null,
  };
}
