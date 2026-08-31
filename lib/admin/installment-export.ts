import ExcelJS from 'exceljs';
import {
  INSTALLMENT_REPORT_HEADERS,
  type InstallmentReportRow,
} from '@/lib/admin/installment-report';

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildInstallmentCsv(rows: InstallmentReportRow[]): Buffer {
  const lines = [
    INSTALLMENT_REPORT_HEADERS.join(','),
    ...rows.map((row) =>
      [
        row.patientName,
        row.phone,
        row.title,
        row.totalAmount,
        row.paidAmount,
        row.remaining,
        row.sourceLabel,
        row.status,
        row.nextDue,
        row.createdAt,
      ]
        .map(escapeCsvCell)
        .join(','),
    ),
  ];
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}

export async function buildInstallmentXlsx(
  rows: InstallmentReportRow[],
  sheetTitle: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pasteur Plus Admin';
  const sheet = workbook.addWorksheet(sheetTitle.slice(0, 31), {
    views: [{ rightToLeft: true }],
  });

  sheet.addRow([...INSTALLMENT_REPORT_HEADERS]);
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow([
      row.patientName,
      row.phone,
      row.title,
      row.totalAmount,
      row.paidAmount,
      row.remaining,
      row.sourceLabel,
      row.status,
      row.nextDue,
      row.createdAt,
    ]);
  }

  sheet.columns.forEach((column) => {
    column.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildInstallmentPdfHtml(
  rows: InstallmentReportRow[],
  reportTitle: string,
): string {
  const generatedAt = new Date().toLocaleString('fa-IR');
  const tableRows = rows
    .map(
      (row) => `<tr>
        <td>${row.patientName}</td>
        <td dir="ltr">${row.phone}</td>
        <td>${row.title}</td>
        <td>${row.totalAmount.toLocaleString('fa-IR')}</td>
        <td>${row.paidAmount.toLocaleString('fa-IR')}</td>
        <td>${row.remaining.toLocaleString('fa-IR')}</td>
        <td>${row.sourceLabel}</td>
        <td>${row.status}</td>
        <td>${row.nextDue}</td>
        <td>${row.createdAt}</td>
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
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
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
  <p>تاریخ گزارش: ${generatedAt} · تعداد: ${rows.length.toLocaleString('fa-IR')}</p>
  <p class="no-print">برای ذخیره PDF از «چاپ → ذخیره به PDF» استفاده کنید.</p>
  <table>
    <thead>
      <tr>${INSTALLMENT_REPORT_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="10">رکوردی نیست.</td></tr>'}</tbody>
  </table>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 300);
    });
  </script>
</body>
</html>`;
}
