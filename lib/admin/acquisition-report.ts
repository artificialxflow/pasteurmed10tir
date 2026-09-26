import {
  ACQUISITION_SOURCES,
  ACQUISITION_SOURCE_LABELS,
  type AcquisitionSource,
} from '@/lib/patient/acquisition-source';

export type AcquisitionReportPeriod = 'day' | 'week' | 'month' | 'all';

export type AcquisitionReportRange = {
  from: Date | null;
  to: Date;
  periodLabel: string;
  period: AcquisitionReportPeriod | 'custom';
};

export type AcquisitionReportRow = {
  label: string;
  count: number;
  sourceKey: string;
};

export type AcquisitionReportStats = {
  generatedAt: string;
  periodLabel: string;
  period: AcquisitionReportPeriod | 'custom';
  from: string | null;
  to: string;
  totalProfiles: number;
  withSource: number;
  withoutSource: number;
  rows: AcquisitionReportRow[];
};

export const ACQUISITION_REPORT_HEADERS = ['نحوه آشنایی', 'تعداد'] as const;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseIsoDate(raw: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function parseAcquisitionReportRange(searchParams: URLSearchParams): AcquisitionReportRange {
  const fromRaw = searchParams.get('from')?.trim();
  const toRaw = searchParams.get('to')?.trim();
  if (fromRaw && toRaw) {
    const fromDate = parseIsoDate(fromRaw);
    const toDate = parseIsoDate(toRaw);
    if (fromDate && toDate && fromDate.getTime() <= toDate.getTime()) {
      return {
        from: startOfDay(fromDate),
        to: endOfDay(toDate),
        periodLabel: `${fromRaw} تا ${toRaw}`,
        period: 'custom',
      };
    }
  }

  const periodParam = searchParams.get('period');
  const period: AcquisitionReportPeriod =
    periodParam === 'day' ||
    periodParam === 'week' ||
    periodParam === 'month' ||
    periodParam === 'all'
      ? periodParam
      : 'month';

  const now = new Date();
  const to = endOfDay(now);

  if (period === 'all') {
    return { from: null, to, periodLabel: 'همه زمان‌ها', period };
  }

  const from = startOfDay(now);
  if (period === 'week') {
    from.setDate(from.getDate() - 6);
  } else if (period === 'month') {
    from.setDate(from.getDate() - 29);
  }

  const periodLabel =
    period === 'day'
      ? 'امروز'
      : period === 'week'
        ? '۷ روز اخیر'
        : '۳۰ روز اخیر';

  return { from, to, periodLabel, period };
}

export function buildAcquisitionReportRows(
  counts: Partial<Record<AcquisitionSource | 'unset', number>>,
): AcquisitionReportRow[] {
  const rows: AcquisitionReportRow[] = ACQUISITION_SOURCES.map((source) => ({
    sourceKey: source,
    label: ACQUISITION_SOURCE_LABELS[source],
    count: counts[source] ?? 0,
  }));
  rows.push({
    sourceKey: 'unset',
    label: 'ثبت نشده (کاربران قدیمی)',
    count: counts.unset ?? 0,
  });
  return rows;
}

export function summarizeAcquisitionCounts(
  grouped: { acquisitionSource: AcquisitionSource | null; _count: number }[],
): { withSource: number; withoutSource: number; counts: Partial<Record<AcquisitionSource | 'unset', number>> } {
  const counts: Partial<Record<AcquisitionSource | 'unset', number>> = {};
  let withSource = 0;
  let withoutSource = 0;

  for (const row of grouped) {
    const n = row._count;
    if (row.acquisitionSource == null) {
      counts.unset = n;
      withoutSource += n;
    } else {
      counts[row.acquisitionSource] = n;
      withSource += n;
    }
  }

  return { withSource, withoutSource, counts };
}
