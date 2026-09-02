import ExcelJS from 'exceljs';
import {
  PATIENT_REPORT_HEADERS,
  type PatientReportRow,
} from '@/lib/admin/patient-report';

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowValues(row: PatientReportRow): Array<string | number> {
  return [
    row.name,
    row.phone,
    row.nationalId,
    row.franchisePercent,
    row.baseInsurance,
    row.complementaryInsurance,
    row.zohalLabel,
    row.status,
    row.reviewNote,
    row.createdAt,
    row.updatedAt,
  ];
}

export function buildPatientCsv(rows: PatientReportRow[]): Buffer {
  const lines = [
    PATIENT_REPORT_HEADERS.join(','),
    ...rows.map((row) => rowValues(row).map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}

export async function buildPatientXlsx(
  rows: PatientReportRow[],
  sheetTitle: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pasteur Plus Admin';
  const sheet = workbook.addWorksheet(sheetTitle.slice(0, 31), {
    views: [{ rightToLeft: true }],
  });

  sheet.addRow([...PATIENT_REPORT_HEADERS]);
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

export function buildPatientPdfHtml(rows: PatientReportRow[], reportTitle: string): string {
  const generatedAt = new Date().toLocaleString('fa-IR');
  const tableRows = rows
    .map(
      (row) => `<tr>
        <td>${row.name}</td>
        <td dir="ltr">${row.phone}</td>
        <td dir="ltr">${row.nationalId}</td>
        <td>${row.franchisePercent.toLocaleString('fa-IR')}</td>
        <td>${row.baseInsurance}</td>
        <td>${row.complementaryInsurance}</td>
        <td>${row.zohalLabel}</td>
        <td>${row.status}</td>
        <td>${row.reviewNote}</td>
        <td>${row.createdAt}</td>
        <td>${row.updatedAt}</td>
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
      <tr>${PATIENT_REPORT_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="11">رکوردی نیست.</td></tr>'}</tbody>
  </table>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 300);
    });
  </script>
</body>
</html>`;
}
