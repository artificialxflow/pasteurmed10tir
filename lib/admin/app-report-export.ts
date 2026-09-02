import ExcelJS from 'exceljs';
import { APP_REPORT_HEADERS, type AppReportRow } from '@/lib/admin/app-report';

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildAppReportCsv(rows: AppReportRow[]): Buffer {
  const lines = [
    APP_REPORT_HEADERS.join(','),
    ...rows.map((row) => [row.group, row.label, row.value].map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}

export async function buildAppReportXlsx(
  rows: AppReportRow[],
  sheetTitle: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pasteur Plus Admin';
  const sheet = workbook.addWorksheet(sheetTitle.slice(0, 31), {
    views: [{ rightToLeft: true }],
  });

  sheet.addRow([...APP_REPORT_HEADERS]);
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow([row.group, row.label, row.value]);
  }

  sheet.columns.forEach((column) => {
    column.width = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildAppReportPdfHtml(rows: AppReportRow[], reportTitle: string): string {
  const generatedAt = new Date().toLocaleString('fa-IR');
  const tableRows = rows
    .map(
      (row) => `<tr>
        <td>${row.group}</td>
        <td>${row.label}</td>
        <td>${row.value.toLocaleString('fa-IR')}</td>
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
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
    th { background: #ecfeff; }
    @media print {
      body { margin: 12px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${reportTitle}</h1>
  <p>تاریخ گزارش: ${generatedAt} · تعداد شاخص: ${rows.length.toLocaleString('fa-IR')}</p>
  <p class="no-print">برای ذخیره PDF از «چاپ → ذخیره به PDF» استفاده کنید.</p>
  <table>
    <thead>
      <tr>${APP_REPORT_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="3">رکوردی نیست.</td></tr>'}</tbody>
  </table>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 300);
    });
  </script>
</body>
</html>`;
}
