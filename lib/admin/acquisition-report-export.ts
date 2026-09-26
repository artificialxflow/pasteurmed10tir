import ExcelJS from 'exceljs';
import {
  ACQUISITION_REPORT_HEADERS,
  type AcquisitionReportRow,
  type AcquisitionReportStats,
} from '@/lib/admin/acquisition-report';

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildAcquisitionReportCsv(stats: AcquisitionReportStats): Buffer {
  const meta = [
    `بازه,${stats.periodLabel}`,
    `از,${stats.from ?? '—'}`,
    `تا,${stats.to}`,
    `کل پروفایل,${stats.totalProfiles}`,
    '',
  ];
  const lines = [
    ...meta,
    ACQUISITION_REPORT_HEADERS.join(','),
    ...stats.rows.map((row) => [row.label, row.count].map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}

export async function buildAcquisitionReportXlsx(
  stats: AcquisitionReportStats,
  sheetTitle: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pasteur Plus Admin';
  const sheet = workbook.addWorksheet(sheetTitle.slice(0, 31), {
    views: [{ rightToLeft: true }],
  });

  sheet.addRow(['بازه', stats.periodLabel]);
  sheet.addRow(['از', stats.from ?? '—']);
  sheet.addRow(['تا', stats.to]);
  sheet.addRow(['کل پروفایل در بازه', stats.totalProfiles]);
  sheet.addRow([]);

  sheet.addRow([...ACQUISITION_REPORT_HEADERS]);
  sheet.getRow(6).font = { bold: true };

  for (const row of stats.rows) {
    sheet.addRow([row.label, row.count]);
  }

  sheet.columns.forEach((column) => {
    column.width = 28;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildAcquisitionReportPdfHtml(
  stats: AcquisitionReportStats,
  reportTitle: string,
): string {
  const generatedAt = new Date(stats.generatedAt).toLocaleString('fa-IR');
  const tableRows = stats.rows
    .map(
      (row: AcquisitionReportRow) => `<tr>
        <td>${row.label}</td>
        <td>${row.count.toLocaleString('fa-IR')}</td>
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
    p { font-size: 13px; color: #475569; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
    th { background: #ecfeff; }
  </style>
</head>
<body>
  <h1>${reportTitle}</h1>
  <p>تاریخ گزارش: ${generatedAt}</p>
  <p>بازه: ${stats.periodLabel}</p>
  <p>کل پروفایل در بازه: ${stats.totalProfiles.toLocaleString('fa-IR')}</p>
  <table>
    <thead>
      <tr>${ACQUISITION_REPORT_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;
}
