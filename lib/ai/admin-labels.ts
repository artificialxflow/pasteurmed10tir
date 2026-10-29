/** برچسب‌های فارسی پنل ادمین AI — مقادیر enum در DB انگلیسی می‌مانند. */

export type AiPendingStatusKey = 'open' | 'answered' | 'dismissed' | 'all';

export const AI_PENDING_STATUS_LABELS: Record<AiPendingStatusKey, string> = {
  open: 'باز',
  answered: 'پاسخ‌داده',
  dismissed: 'رد شده',
  all: 'همه',
};

export type AiKnowledgeSourceKey =
  | 'site_map'
  | 'admin_manual'
  | 'from_pending'
  | 'org_policy';

export const AI_KNOWLEDGE_SOURCE_LABELS: Record<AiKnowledgeSourceKey, string> = {
  site_map: 'نقشه سایت',
  admin_manual: 'ثبت دستی',
  from_pending: 'از صف سوالات',
  org_policy: 'قرارداد سازمانی',
};

export function labelAiPendingStatus(status: string): string {
  if (status in AI_PENDING_STATUS_LABELS) {
    return AI_PENDING_STATUS_LABELS[status as AiPendingStatusKey];
  }
  return status;
}

export function labelAiKnowledgeSource(source: string): string {
  if (source in AI_KNOWLEDGE_SOURCE_LABELS) {
    return AI_KNOWLEDGE_SOURCE_LABELS[source as AiKnowledgeSourceKey];
  }
  return source;
}

export function orgSelectLabel(org: {
  name: string;
  representativePhone?: string | null;
}): string {
  const phone = org.representativePhone?.trim();
  if (phone) return `${org.name} — ${phone}`;
  return org.name;
}

export function orgNameById(
  orgs: { id: string; name: string; representativePhone?: string | null }[],
  organizationId: string,
): string {
  const org = orgs.find((o) => o.id === organizationId);
  if (!org) return organizationId;
  return orgSelectLabel(org);
}
