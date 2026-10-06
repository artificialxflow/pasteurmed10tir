import type { MarketingReport } from '@prisma/client';
import ExcelJS from 'exceljs';
import { marketingFollowUpKindLabel, marketingKindLabel, marketingUnsuccessfulReasonLabel } from '@/lib/marketing/types';

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const HEADERS = [
  'تاریخ',
  'ویزیتور',
  'موبایل',
  'نوع',
  'شرکت',
  'دلیل ناموفق',
  'نوع پیگیری',
  'سررسید پیگیری',
  'یادداشت',
];

export function marketingRowsForExport(
  rows: Array<
    MarketingReport & {
      visitor?: { name: string } | null;
    }
  >,
) {
  return rows.map((r) => [
    r.createdAt.toISOString().slice(0, 10),
    r.visitor?.name ?? String(r.visitorId),
    r.visitorPhone,
    marketingKindLabel(r.kind),
    r.companyName || '',
    marketingUnsuccessfulReasonLabel(r.unsuccessfulReason),
    marketingFollowUpKindLabel(r.followUpKind),
    r.followUpDueDate?.toISOString().slice(0, 10) ?? '',
    r.blockedNote || r.unsuccessfulNotes || '',
  ]);
}

export function buildMarketingCsv(
  rows: Array<MarketingReport & { visitor?: { name: string } | null }>,
): Buffer {
  const lines = [
    HEADERS.join(','),
    ...marketingRowsForExport(rows).map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}

export async function buildMarketingXlsx(
  rows: Array<MarketingReport & { visitor?: { name: string } | null }>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('بازاریابی', { views: [{ rightToLeft: true }] });
  sheet.addRow(HEADERS);
  sheet.getRow(1).font = { bold: true };
  for (const row of marketingRowsForExport(rows)) {
    sheet.addRow(row);
  }
  sheet.columns.forEach((c) => {
    c.width = 20;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
