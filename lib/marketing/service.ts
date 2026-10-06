import type {
  MarketingFollowUpKind,
  MarketingNewCaseOutcome,
  MarketingReportKind,
  MarketingUnsuccessfulReason,
  Prisma,
} from '@prisma/client';
import { mapMarketingReport } from '@/lib/marketing/mappers';
import {
  MARKETING_FOLLOW_UP_KIND_OPTIONS,
  MARKETING_FOLLOW_UP_SLOT_COUNT,
  MARKETING_KIND_OPTIONS,
  MARKETING_NEW_CASE_OUTCOME_OPTIONS,
  MARKETING_UNSUCCESSFUL_REASON_OPTIONS,
  type MarketingContact,
} from '@/lib/marketing/types';
import { generateOperationId } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { parseIsoDateOnly } from '@/lib/follow-up/types';
import { prisma } from '@/lib/prisma';
import type { VisitorSelf } from '@/lib/commerce/visitor-service';

function parseContactsInput(raw: unknown): MarketingContact[] {
  if (!Array.isArray(raw)) return [];
  const out: MarketingContact[] = [];
  for (let i = 0; i < 3; i++) {
    const c = raw[i];
    if (!c || typeof c !== 'object') {
      out.push({ name: '', phone: '', role: '' });
      continue;
    }
    out.push({
      name: String((c as MarketingContact).name || '').trim(),
      phone: normalizePhoneDigits(String((c as MarketingContact).phone || '')),
      role: String((c as MarketingContact).role || '').trim(),
    });
  }
  return out;
}

function isKind(v: string): v is MarketingReportKind {
  return MARKETING_KIND_OPTIONS.some((o) => o.id === v);
}

function isNewOutcome(v: string): v is MarketingNewCaseOutcome {
  return MARKETING_NEW_CASE_OUTCOME_OPTIONS.some((o) => o.id === v);
}

function isUnsuccessfulReason(v: string): v is MarketingUnsuccessfulReason {
  return MARKETING_UNSUCCESSFUL_REASON_OPTIONS.some((o) => o.id === v);
}

function isFollowUpKind(v: string): v is MarketingFollowUpKind {
  return MARKETING_FOLLOW_UP_KIND_OPTIONS.some((o) => o.id === v);
}

export type CreateMarketingReportInput = {
  kind?: unknown;
  companyName?: unknown;
  contacts?: unknown;
  newCaseOutcome?: unknown;
  successRequest?: unknown;
  successContract?: unknown;
  successBanner?: unknown;
  successSkin?: unknown;
  contractDate?: unknown;
  unsuccessfulReason?: unknown;
  unsuccessfulNotes?: unknown;
  followUpKind?: unknown;
  followUpDueDate?: unknown;
  blockedNote?: unknown;
};

export function parseCreateMarketingReportBody(body: CreateMarketingReportInput) {
  const kind = String(body.kind || '').trim();
  if (!isKind(kind)) throw new Error('نوع گزارش بازاریابی نامعتبر است.');

  const companyName = String(body.companyName || '').trim();
  const contacts = parseContactsInput(body.contacts);
  const newCaseOutcomeRaw = String(body.newCaseOutcome || '').trim();
  const newCaseOutcome = newCaseOutcomeRaw && isNewOutcome(newCaseOutcomeRaw)
    ? newCaseOutcomeRaw
    : null;

  if (kind === 'new_case') {
    if (companyName.length < 2) throw new Error('نام شرکت یا مؤسسه الزامی است.');
    if (!newCaseOutcome) throw new Error('نتیجه مورد جدید را انتخاب کنید.');
  }

  const successRequest = Boolean(body.successRequest);
  const successContract = Boolean(body.successContract);
  const successBanner = Boolean(body.successBanner);
  const successSkin = Boolean(body.successSkin);
  const contractDate = parseIsoDateOnly(body.contractDate);

  const unsuccessfulReasonRaw = String(body.unsuccessfulReason || '').trim();
  const unsuccessfulReason =
    unsuccessfulReasonRaw && isUnsuccessfulReason(unsuccessfulReasonRaw)
      ? unsuccessfulReasonRaw
      : null;
  const unsuccessfulNotes = String(body.unsuccessfulNotes || '').trim();

  const followUpKindRaw = String(body.followUpKind || '').trim();
  const followUpKind =
    followUpKindRaw && isFollowUpKind(followUpKindRaw) ? followUpKindRaw : null;
  const followUpDueDate = parseIsoDateOnly(body.followUpDueDate);

  const blockedNote = String(body.blockedNote || '').trim();

  const needsSuccess =
    kind === 'success' || (kind === 'new_case' && newCaseOutcome === 'success');
  const needsUnsuccessful =
    kind === 'unsuccessful' || (kind === 'new_case' && newCaseOutcome === 'unsuccessful');
  const needsFollowUp =
    kind === 'follow_up' || (kind === 'new_case' && newCaseOutcome === 'follow_up');
  const needsBlocked =
    kind === 'blocked' || (kind === 'new_case' && newCaseOutcome === 'blocked');

  if (needsSuccess) {
    if (!successRequest && !successContract && !successBanner && !successSkin) {
      throw new Error('حداقل یک اقدام موفق را انتخاب کنید.');
    }
  }

  if (needsUnsuccessful) {
    if (!unsuccessfulReason) throw new Error('دلیل ناموفق را انتخاب کنید.');
  }

  if (needsFollowUp) {
    if (!followUpKind) throw new Error('نوع پیگیری را انتخاب کنید.');
    if (!followUpDueDate) throw new Error('تاریخ پیگیری الزامی است.');
  }

  if (needsBlocked && kind === 'blocked' && blockedNote.length < 2) {
    throw new Error('توضیح کوتاه برای مسدودی وارد کنید.');
  }

  return {
    kind,
    companyName: companyName || null,
    contactsJson: JSON.stringify(contacts),
    newCaseOutcome,
    successRequest,
    successContract,
    successBanner,
    successSkin,
    contractDate,
    unsuccessfulReason,
    unsuccessfulNotes: unsuccessfulNotes || null,
    followUpKind,
    followUpDueDate,
    blockedNote: blockedNote || null,
  };
}

async function ensureFollowUpSlots(reportId: string) {
  const existing = await prisma.marketingFollowUpSlot.count({ where: { reportId } });
  if (existing >= MARKETING_FOLLOW_UP_SLOT_COUNT) return;
  const toCreate = [];
  for (let slotIndex = 1; slotIndex <= MARKETING_FOLLOW_UP_SLOT_COUNT; slotIndex++) {
    toCreate.push({
      id: generateOperationId(),
      reportId,
      slotIndex,
    });
  }
  await prisma.marketingFollowUpSlot.createMany({
    data: toCreate,
    skipDuplicates: true,
  });
}

export async function createMarketingReport(
  visitor: VisitorSelf,
  body: CreateMarketingReportInput,
) {
  const parsed = parseCreateMarketingReportBody(body);
  const id = generateOperationId();

  const row = await prisma.marketingReport.create({
    data: {
      id,
      visitorId: visitor.id,
      visitorPhone: visitor.phone,
      ...parsed,
    },
    include: { followUpSlots: true },
  });

  const effectiveFollowUp =
    parsed.kind === 'follow_up' ||
    (parsed.kind === 'new_case' && parsed.newCaseOutcome === 'follow_up');
  if (effectiveFollowUp) {
    await ensureFollowUpSlots(id);
    const refreshed = await prisma.marketingReport.findUnique({
      where: { id },
      include: { followUpSlots: true },
    });
    return mapMarketingReport(refreshed!);
  }

  return mapMarketingReport(row);
}

export async function listMarketingReportsForVisitor(visitorId: number) {
  const rows = await prisma.marketingReport.findMany({
    where: { visitorId },
    orderBy: [{ createdAt: 'desc' }],
    take: 200,
    include: { followUpSlots: { orderBy: { slotIndex: 'asc' } } },
  });
  return rows.map(mapMarketingReport);
}

export async function getMarketingReportForVisitor(reportId: string, visitorId: number) {
  const row = await prisma.marketingReport.findFirst({
    where: { id: reportId, visitorId },
    include: { followUpSlots: { orderBy: { slotIndex: 'asc' } } },
  });
  return row ? mapMarketingReport(row) : null;
}

export type UpdateFollowUpSlotInput = {
  slotIndex?: unknown;
  doneAt?: unknown;
  note?: unknown;
};

export async function updateMarketingFollowUpSlot(
  reportId: string,
  visitorId: number,
  body: UpdateFollowUpSlotInput,
) {
  const report = await prisma.marketingReport.findFirst({
    where: { id: reportId, visitorId },
  });
  if (!report) throw new Error('گزارش یافت نشد.');

  const slotIndex = Number(body.slotIndex);
  if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > MARKETING_FOLLOW_UP_SLOT_COUNT) {
    throw new Error('شماره پیگیری نامعتبر است.');
  }

  await ensureFollowUpSlots(reportId);

  const doneAt = parseIsoDateOnly(body.doneAt);
  if (!doneAt) throw new Error('تاریخ انجام پیگیری الزامی است.');
  const note = String(body.note || '').trim() || null;

  const slot = await prisma.marketingFollowUpSlot.findFirst({
    where: { reportId, slotIndex },
  });
  if (!slot) throw new Error('اسلات پیگیری یافت نشد.');

  await prisma.marketingFollowUpSlot.update({
    where: { id: slot.id },
    data: { doneAt, note },
  });

  const refreshed = await prisma.marketingReport.findUnique({
    where: { id: reportId },
    include: { followUpSlots: { orderBy: { slotIndex: 'asc' } } },
  });
  return mapMarketingReport(refreshed!);
}

export type AdminMarketingListQuery = {
  visitorId?: string | null;
  kind?: string | null;
  blockedOnly?: boolean;
  from?: string | null;
  to?: string | null;
};

export function buildAdminMarketingWhere(query: AdminMarketingListQuery): Prisma.MarketingReportWhereInput {
  const and: Prisma.MarketingReportWhereInput[] = [];

  const visitorId = Number(query.visitorId);
  if (Number.isInteger(visitorId) && visitorId > 0) {
    and.push({ visitorId });
  }

  const kind = String(query.kind || '').trim();
  if (isKind(kind)) and.push({ kind });

  if (query.blockedOnly) {
    and.push({
      OR: [{ kind: 'blocked' }, { newCaseOutcome: 'blocked' }],
    });
  }

  const from = parseIsoDateOnly(query.from);
  const to = parseIsoDateOnly(query.to);
  if (from || to) {
    and.push({
      createdAt: {
        ...(from ? { gte: new Date(`${from.toISOString().slice(0, 10)}T00:00:00.000Z`) } : {}),
        ...(to ? { lte: new Date(`${to.toISOString().slice(0, 10)}T23:59:59.999Z`) } : {}),
      },
    });
  }

  return and.length ? { AND: and } : {};
}

export async function listMarketingReportsAdmin(query: AdminMarketingListQuery) {
  const rows = await prisma.marketingReport.findMany({
    where: buildAdminMarketingWhere(query),
    orderBy: [{ createdAt: 'desc' }],
    take: 500,
    include: { followUpSlots: { orderBy: { slotIndex: 'asc' } } },
  });
  return rows.map(mapMarketingReport);
}

export async function getMarketingReportAdmin(id: string) {
  const row = await prisma.marketingReport.findUnique({
    where: { id },
    include: { followUpSlots: { orderBy: { slotIndex: 'asc' } } },
  });
  return row ? mapMarketingReport(row) : null;
}

export async function buildMarketingVisitorStats() {
  const visitors = await prisma.visitor.findMany({ orderBy: { id: 'asc' } });
  const counts = await prisma.marketingReport.groupBy({
    by: ['visitorId', 'kind'],
    _count: { _all: true },
  });

  const byVisitor = new Map<number, Record<string, number>>();
  for (const row of counts) {
    const map = byVisitor.get(row.visitorId) || {};
    map[row.kind] = row._count._all;
    byVisitor.set(row.visitorId, map);
  }

  return visitors.map((v) => {
    const c = byVisitor.get(v.id) || {};
    const success = (c.success || 0) + (c.new_case || 0); // approximate - better count by outcome
    return {
      visitorId: v.id,
      visitorName: v.name,
      visitorPhone: v.phone,
      visitorCode: v.code,
      status: v.status,
      totalActivity: Object.values(c).reduce((a, b) => a + b, 0),
      kindCounts: c,
    };
  });
}

/** نرخ موفقیت: موفق / (موفق + ناموفق + follow_up باز) */
export async function computeMarketingSuccessRates() {
  const reports = await prisma.marketingReport.findMany({
    select: { visitorId: true, kind: true, newCaseOutcome: true },
  });

  type Bucket = { success: number; unsuccessful: number; followUp: number; blocked: number; total: number };
  const map = new Map<number, Bucket>();

  function bucket(id: number): Bucket {
    let b = map.get(id);
    if (!b) {
      b = { success: 0, unsuccessful: 0, followUp: 0, blocked: 0, total: 0 };
      map.set(id, b);
    }
    return b;
  }

  for (const r of reports) {
    const b = bucket(r.visitorId);
    b.total += 1;
    const effectiveKind =
      r.kind === 'new_case' && r.newCaseOutcome ? r.newCaseOutcome : r.kind;
    if (effectiveKind === 'success') b.success += 1;
    else if (effectiveKind === 'unsuccessful') b.unsuccessful += 1;
    else if (effectiveKind === 'follow_up') b.followUp += 1;
    else if (effectiveKind === 'blocked') b.blocked += 1;
  }

  const visitors = await prisma.visitor.findMany({ orderBy: { id: 'asc' } });
  return visitors.map((v) => {
    const b = map.get(v.id) || { success: 0, unsuccessful: 0, followUp: 0, blocked: 0, total: 0 };
    const denom = b.success + b.unsuccessful + b.followUp;
    const successRate = denom > 0 ? Math.round((b.success / denom) * 100) : null;
    return {
      visitorId: v.id,
      visitorName: v.name,
      visitorPhone: v.phone,
      visitorCode: v.code,
      status: v.status,
      totalActivity: b.total,
      successCount: b.success,
      unsuccessfulCount: b.unsuccessful,
      followUpCount: b.followUp,
      blockedCount: b.blocked,
      successRate,
    };
  });
}
