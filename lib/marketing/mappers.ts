import type { MarketingFollowUpSlot, MarketingReport } from '@prisma/client';
import {
  marketingFollowUpKindLabel,
  marketingKindLabel,
  marketingUnsuccessfulReasonLabel,
  type MarketingContact,
} from '@/lib/marketing/types';

function parseContacts(json: string | null | undefined): MarketingContact[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((c) => ({
        name: String((c as MarketingContact).name || '').trim(),
        phone: String((c as MarketingContact).phone || '').trim(),
        role: String((c as MarketingContact).role || '').trim(),
      }))
      .filter((c) => c.name || c.phone);
  } catch {
    return [];
  }
}

export function mapMarketingFollowUpSlot(row: MarketingFollowUpSlot) {
  return {
    id: row.id,
    slotIndex: row.slotIndex,
    doneAt: row.doneAt?.toISOString().slice(0, 10),
    note: row.note ?? undefined,
  };
}

export function mapMarketingReport(
  row: MarketingReport & { followUpSlots?: MarketingFollowUpSlot[] },
) {
  return {
    id: row.id,
    visitorId: row.visitorId,
    visitorPhone: row.visitorPhone,
    kind: row.kind,
    kindLabel: marketingKindLabel(row.kind),
    companyName: row.companyName ?? undefined,
    contacts: parseContacts(row.contactsJson),
    newCaseOutcome: row.newCaseOutcome ?? undefined,
    successRequest: row.successRequest,
    successContract: row.successContract,
    successBanner: row.successBanner,
    successSkin: row.successSkin,
    successProforma: row.successProforma,
    successSalesInvoice: row.successSalesInvoice,
    contractDate: row.contractDate?.toISOString().slice(0, 10),
    unsuccessfulReason: row.unsuccessfulReason ?? undefined,
    unsuccessfulReasonLabel: marketingUnsuccessfulReasonLabel(row.unsuccessfulReason),
    unsuccessfulNotes: row.unsuccessfulNotes ?? undefined,
    followUpKind: row.followUpKind ?? undefined,
    followUpKindLabel: marketingFollowUpKindLabel(row.followUpKind),
    followUpDueDate: row.followUpDueDate?.toISOString().slice(0, 10),
    blockedNote: row.blockedNote ?? undefined,
    successNotes: row.successNotes ?? undefined,
    followUpSlots: (row.followUpSlots || [])
      .sort((a, b) => a.slotIndex - b.slotIndex)
      .map(mapMarketingFollowUpSlot),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type MarketingReportPublic = ReturnType<typeof mapMarketingReport>;
