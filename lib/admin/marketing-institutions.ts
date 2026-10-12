import { prisma } from '@/lib/prisma';

export type MarketingInstitutionRow = {
  companyName: string;
  visitorId: number;
  visitorName: string;
  lastReportAt: string;
  reportCount: number;
  contacts: Array<{ name: string; phone: string; role: string }>;
};

function parseContacts(json: string | null): Array<{ name: string; phone: string; role: string }> {
  if (!json) return [];
  try {
    const raw = JSON.parse(json) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((c) => {
        const o = c as Record<string, unknown>;
        return {
          name: String(o.name || '').trim(),
          phone: String(o.phone || '').trim(),
          role: String(o.role || '').trim(),
        };
      })
      .filter((c) => c.name.length >= 2);
  } catch {
    return [];
  }
}

export async function listMarketingInstitutions(q?: string): Promise<MarketingInstitutionRow[]> {
  const reports = await prisma.marketingReport.findMany({
    where: q
      ? {
          companyName: { contains: q, mode: 'insensitive' },
        }
      : undefined,
    include: { visitor: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const map = new Map<string, MarketingInstitutionRow>();

  for (const r of reports) {
    const companyName = (r.companyName || '').trim();
    if (companyName.length < 2) continue;
    const key = `${r.visitorId}::${companyName.toLowerCase()}`;
    const existing = map.get(key);
    const contacts = parseContacts(r.contactsJson);
    if (!existing) {
      map.set(key, {
        companyName,
        visitorId: r.visitorId,
        visitorName: r.visitor.name,
        lastReportAt: r.createdAt.toISOString(),
        reportCount: 1,
        contacts,
      });
    } else {
      existing.reportCount += 1;
      if (r.createdAt > new Date(existing.lastReportAt)) {
        existing.lastReportAt = r.createdAt.toISOString();
        if (contacts.length) existing.contacts = contacts;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    b.lastReportAt.localeCompare(a.lastReportAt),
  );
}

export function institutionsToCsv(rows: MarketingInstitutionRow[]): Buffer {
  const header = ['شرکت', 'ویزیتور', 'آخرین گزارش', 'تعداد گزارش', 'مسئول ۱', 'مسئول ۲', 'مسئول ۳'];
  const lines = [header.join(',')];
  for (const row of rows) {
    const c = row.contacts;
    const cells = [
      row.companyName,
      row.visitorName,
      new Date(row.lastReportAt).toLocaleDateString('fa-IR'),
      String(row.reportCount),
      c[0] ? `${c[0].name} (${c[0].role})` : '',
      c[1] ? `${c[1].name} (${c[1].role})` : '',
      c[2] ? `${c[2].name} (${c[2].role})` : '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(cells.join(','));
  }
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}
