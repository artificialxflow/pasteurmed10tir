import { generateOperationId } from '@/lib/operations/mappers';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { isKnownSection } from '@/lib/health-record/sections';
import { normalizePhoneDigits } from '@/lib/operations/phone';

export async function ensureHealthRecord(userId: string) {
  const existing = await prisma.healthRecord.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.healthRecord.create({
    data: { id: generateOperationId(), userId },
  });
}

export function mapAttachment(row: {
  id: string;
  path: string;
  mimeType: string;
  originalName: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    path: row.path,
    mimeType: row.mimeType,
    originalName: row.originalName,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapEntry(row: {
  id: string;
  recordId: string;
  section: string;
  entryDate: Date;
  payload: Prisma.JsonValue;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  attachments?: Array<{
    id: string;
    path: string;
    mimeType: string;
    originalName: string;
    createdAt: Date;
  }>;
}) {
  return {
    id: row.id,
    recordId: row.recordId,
    section: row.section,
    date: row.entryDate.toISOString().slice(0, 10),
    payload: row.payload,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    attachments: (row.attachments || []).map(mapAttachment),
  };
}

export async function createHealthEntry(input: {
  userId: string;
  section: string;
  date: string;
  payload: Record<string, unknown>;
  createdByUserId?: string | null;
}) {
  if (!isKnownSection(input.section)) {
    throw new Error('بخش نامعتبر است.');
  }
  const date = new Date(`${input.date}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error('تاریخ نامعتبر است.');

  const record = await ensureHealthRecord(input.userId);
  const row = await prisma.healthRecordEntry.create({
    data: {
      id: generateOperationId(),
      recordId: record.id,
      section: input.section,
      entryDate: date,
      payload: input.payload as Prisma.InputJsonValue,
      createdByUserId: input.createdByUserId ?? input.userId,
    },
    include: { attachments: true },
  });
  return mapEntry(row);
}

export async function findUserByPatientPhone(phone: string) {
  const key = normalizePhoneDigits(phone);
  if (!key) return null;
  return prisma.user.findUnique({
    where: { phone: key },
    include: { profile: true, healthRecord: true },
  });
}

export async function searchHealthRecordPatients(q: string) {
  const raw = q.trim();
  if (raw.length < 2) return [] as Array<{ id: string; name: string; phone: string }>;
  const digits = normalizePhoneDigits(raw);
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: raw, mode: 'insensitive' } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
      ],
    },
    select: { id: true, name: true, phone: true },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
  return users;
}

export async function listHealthRecordsByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, healthRecord: true },
  });
  if (!user) return { user: null, items: [] as ReturnType<typeof mapEntry>[] };
  const listed = await listHealthEntries(user.id);
  return {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      recordId: listed.recordId,
    },
    items: listed.items,
  };
}

export async function listHealthRecordsByPhone(phone: string) {
  const user = await findUserByPatientPhone(phone);
  if (!user) return { user: null, items: [] as ReturnType<typeof mapEntry>[] };
  return listHealthRecordsByUserId(user.id);
}

export async function createHealthEntryForPhone(input: {
  patientPhone: string;
  section: string;
  date: string;
  payload: Record<string, unknown>;
  createdByAdminId?: string | null;
}) {
  const user = await findUserByPatientPhone(input.patientPhone);
  if (!user) throw new Error('بیمار با این موبایل یافت نشد.');
  return createHealthEntry({
    userId: user.id,
    section: input.section,
    date: input.date,
    payload: input.payload,
    createdByUserId: input.createdByAdminId || user.id,
  });
}

export async function listHealthEntries(userId: string, section?: string) {
  const record = await ensureHealthRecord(userId);
  const rows = await prisma.healthRecordEntry.findMany({
    where: {
      recordId: record.id,
      ...(section ? { section } : {}),
    },
    include: { attachments: true },
    orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
  });
  return { recordId: record.id, items: rows.map(mapEntry) };
}

export async function getHealthEntryForUser(userId: string, entryId: string) {
  const record = await prisma.healthRecord.findUnique({ where: { userId } });
  if (!record) return null;
  const row = await prisma.healthRecordEntry.findFirst({
    where: { id: entryId, recordId: record.id },
    include: { attachments: true },
  });
  return row ? mapEntry(row) : null;
}

export async function addHealthAttachmentByEntryId(input: {
  entryId: string;
  path: string;
  mimeType: string;
  originalName: string;
}) {
  const row = await prisma.healthRecordEntry.findUnique({ where: { id: input.entryId } });
  if (!row) throw new Error('رکورد یافت نشد.');
  const saved = await prisma.healthRecordAttachment.create({
    data: {
      id: generateOperationId(),
      entryId: input.entryId,
      path: input.path,
      mimeType: input.mimeType,
      originalName: input.originalName,
    },
  });
  return mapAttachment(saved);
}

export async function addHealthAttachment(input: {
  userId: string;
  entryId: string;
  path: string;
  mimeType: string;
  originalName: string;
}) {
  const entry = await getHealthEntryForUser(input.userId, input.entryId);
  if (!entry) throw new Error('رکورد یافت نشد.');
  const row = await prisma.healthRecordAttachment.create({
    data: {
      id: generateOperationId(),
      entryId: input.entryId,
      path: input.path,
      mimeType: input.mimeType,
      originalName: input.originalName,
    },
  });
  return mapAttachment(row);
}
