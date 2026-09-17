import ExcelJS from 'exceljs';
import {
  fieldStaffKindLabel,
  staffCommissionSourceLabel,
  staffCommissionStatusLabel,
} from '@/lib/home-visit/labels';
import { formatJalaliDate } from '@/lib/patient';
import { formatPrice } from '@/lib/utils';

export const STAFF_COMMISSION_REPORT_HEADERS = [
  'نیرو',
  'نوع',
  'منبع',
  'برچسب منبع',
  'شناسه درخواست',
  'مبلغ پایه',
  'درصد',
  'پورسانت',
  'وضعیت',
  'تاریخ',
  'پرداخت',
] as const;

export type StaffCommissionExportRow = {
  staffName: string;
  staffKind: string;
  requestId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status?: string;
  paidAt?: string | null;
  sourceType?: string | null;
  sourceLabel?: string | null;
  createdAt: string;
};

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowValues(row: StaffCommissionExportRow): Array<string | number> {
  return [
    row.staffName,
    fieldStaffKindLabel(row.staffKind),
    staffCommissionSourceLabel(row.sourceType),
    row.sourceLabel || '—',
    row.requestId,
    formatPrice(row.amount),
    `${row.commissionRate.toLocaleString('fa-IR')}٪`,
    formatPrice(row.commissionAmount),
    staffCommissionStatusLabel(row.status),
    formatJalaliDate(row.createdAt),
    row.paidAt ? formatJalaliDate(row.paidAt) : '—',
  ];
}

export function buildStaffCommissionCsv(rows: StaffCommissionExportRow[]): Buffer {
  const lines = [
    STAFF_COMMISSION_REPORT_HEADERS.join(','),
    ...rows.map((row) => rowValues(row).map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}

export async function buildStaffCommissionXlsx(
  rows: StaffCommissionExportRow[],
  sheetTitle: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pasteur Plus Admin';
  const sheet = workbook.addWorksheet(sheetTitle.slice(0, 31), {
    views: [{ rightToLeft: true }],
  });
  sheet.addRow([...STAFF_COMMISSION_REPORT_HEADERS]);
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(rowValues(row));
  }
  sheet.columns.forEach((column) => {
    column.width = 16;
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildStaffCommissionPdfHtml(
  rows: StaffCommissionExportRow[],
  reportTitle: string,
): string {
  const generatedAt = new Date().toLocaleString('fa-IR');
  const tableRows = rows
    .map(
      (row) => `<tr>
        <td>${row.staffName}</td>
        <td>${fieldStaffKindLabel(row.staffKind)}</td>
        <td>${staffCommissionSourceLabel(row.sourceType)}</td>
        <td>${row.sourceLabel || '—'}</td>
        <td dir="ltr">${row.requestId}</td>
        <td>${formatPrice(row.amount)}</td>
        <td>${row.commissionRate.toLocaleString('fa-IR')}٪</td>
        <td>${formatPrice(row.commissionAmount)}</td>
        <td>${staffCommissionStatusLabel(row.status)}</td>
        <td>${formatJalaliDate(row.createdAt)}</td>
        <td>${row.paidAt ? formatJalaliDate(row.paidAt) : '—'}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${reportTitle}</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; margin: 24px; color: #0f172a; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    p { font-size: 13px; color: #475569; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: right; }
    th { background: #ecfeff; }
    @media print { body { margin: 12px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>${reportTitle}</h1>
  <p>تاریخ گزارش: ${generatedAt} · تعداد: ${rows.length.toLocaleString('fa-IR')}</p>
  <p class="no-print">برای ذخیره PDF از «چاپ → ذخیره به PDF» استفاده کنید.</p>
  <table>
    <thead>
      <tr>${STAFF_COMMISSION_REPORT_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>${tableRows || `<tr><td colspan="${STAFF_COMMISSION_REPORT_HEADERS.length}">رکوردی نیست.</td></tr>`}</tbody>
  </table>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 300);
    });
  </script>
</body>
</html>`;
}
