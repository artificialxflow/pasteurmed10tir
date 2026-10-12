import type { MarketingFollowUpSlot, MarketingReport } from '@prisma/client';
import ExcelJS from 'exceljs';
import { marketingFollowUpKindLabel, marketingKindLabel, marketingUnsuccessfulReasonLabel } from '@/lib/marketing/types';

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function parseContacts(json: string | null | undefined) {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as Array<{ name?: string; phone?: string; role?: string }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 3);
  } catch {
    return [];
  }
}

const HEADERS = [
  'تاریخ',
  'ویزیتور',
  'موبایل',
  'نوع',
  'شرکت',
  'مسئول۱',
  'موبایل۱',
  'سمت۱',
  'مسئول۲',
  'موبایل۲',
  'سمت۲',
  'مسئول۳',
  'موبایل۳',
  'سمت۳',
  'درخواست',
  'قرارداد',
  'بنر',
  'پوستر',
  'پیش‌فاکتور',
  'فاکتور فروش',
  'تاریخ قرارداد',
  'دلیل ناموفق',
  'نوع پیگیری',
  'سررسید پیگیری',
  'پیگیری۱ تاریخ',
  'پیگیری۱ یادداشت',
  'پیگیری۲ تاریخ',
  'پیگیری۲ یادداشت',
  'پیگیری۳ تاریخ',
  'پیگیری۳ یادداشت',
  'پیگیری۴ تاریخ',
  'پیگیری۴ یادداشت',
  'پیگیری۵ تاریخ',
  'پیگیری۵ یادداشت',
  'یادداشت',
];

type ExportRow = MarketingReport & {
  visitor?: { name: string } | null;
  followUpSlots?: MarketingFollowUpSlot[];
};

function slotField(slots: MarketingFollowUpSlot[] | undefined, index: number, field: 'date' | 'note') {
  const s = (slots || []).find((x) => x.slotIndex === index);
  if (!s) return '';
  if (field === 'date') return s.doneAt?.toISOString().slice(0, 10) ?? '';
  return s.note || '';
}

export function marketingRowsForExport(rows: ExportRow[]) {
  return rows.map((r) => {
    const contacts = parseContacts(r.contactsJson);
    const c = (i: number) => contacts[i] || { name: '', phone: '', role: '' };
    const slots = (r.followUpSlots || []).sort((a, b) => a.slotIndex - b.slotIndex);
    return [
      r.createdAt.toISOString().slice(0, 10),
      r.visitor?.name ?? String(r.visitorId),
      r.visitorPhone,
      marketingKindLabel(r.kind),
      r.companyName || '',
      c(0).name || '',
      c(0).phone || '',
      c(0).role || '',
      c(1).name || '',
      c(1).phone || '',
      c(1).role || '',
      c(2).name || '',
      c(2).phone || '',
      c(2).role || '',
      r.successRequest ? 'بله' : '',
      r.successContract ? 'بله' : '',
      r.successBanner ? 'بله' : '',
      r.successSkin ? 'بله' : '',
      r.successProforma ? 'بله' : '',
      r.successSalesInvoice ? 'بله' : '',
      r.contractDate?.toISOString().slice(0, 10) ?? '',
      marketingUnsuccessfulReasonLabel(r.unsuccessfulReason),
      marketingFollowUpKindLabel(r.followUpKind),
      r.followUpDueDate?.toISOString().slice(0, 10) ?? '',
      slotField(slots, 1, 'date'),
      slotField(slots, 1, 'note'),
      slotField(slots, 2, 'date'),
      slotField(slots, 2, 'note'),
      slotField(slots, 3, 'date'),
      slotField(slots, 3, 'note'),
      slotField(slots, 4, 'date'),
      slotField(slots, 4, 'note'),
      slotField(slots, 5, 'date'),
      slotField(slots, 5, 'note'),
      r.blockedNote || r.unsuccessfulNotes || '',
    ];
  });
}

export function buildMarketingCsv(rows: ExportRow[]): Buffer {
  const lines = [
    HEADERS.join(','),
    ...marketingRowsForExport(rows).map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}

export async function buildMarketingXlsx(rows: ExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('بازاریابی', { views: [{ rightToLeft: true }] });
  sheet.addRow(HEADERS);
  sheet.getRow(1).font = { bold: true };
  for (const row of marketingRowsForExport(rows)) {
    sheet.addRow(row);
  }
  sheet.columns.forEach((c) => {
    c.width = 18;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
