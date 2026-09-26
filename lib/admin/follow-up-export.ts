import ExcelJS from 'exceljs';
import type { FollowUpCase, SpecialistReferral } from '@prisma/client';
import { followUpOutcomeLabel, followUpServiceLabel } from '@/lib/follow-up/types';
import { statusSummary } from '@/lib/follow-up/mappers';

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const REFERRAL_HEADERS = [
  'تاریخ',
  'نام ارجاع‌دهنده',
  'نام بیمار',
  'تماس بیمار',
  'متخصص ارجاع‌شده',
  'توضیح',
];

export function referralRowsForExport(rows: SpecialistReferral[]) {
  return rows.map((r) => [
    r.createdAt.toLocaleDateString('fa-IR'),
    r.referrerName,
    r.patientName,
    r.patientPhone,
    r.specialistName,
    r.note || '',
  ]);
}

export function buildReferralsCsv(rows: SpecialistReferral[]): Buffer {
  const lines = [
    REFERRAL_HEADERS.join(','),
    ...referralRowsForExport(rows).map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}

export async function buildReferralsXlsx(rows: SpecialistReferral[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ارجاع متخصص', { views: [{ rightToLeft: true }] });
  sheet.addRow(REFERRAL_HEADERS);
  sheet.getRow(1).font = { bold: true };
  for (const row of referralRowsForExport(rows)) {
    sheet.addRow(row);
  }
  sheet.columns.forEach((c) => {
    c.width = 22;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const FOLLOW_UP_HEADERS = [
  'تاریخ کار',
  'بیمار',
  'تماس',
  'دکتر',
  'بخش',
  'رضایت دکتر',
  'رضایت دستیار',
  'رضایت پذیرش',
  'نتیجه',
  'وضعیت',
  'تاریخ پیگیری',
  'توضیح',
];

export function followUpRowsForExport(rows: FollowUpCase[]) {
  return rows.map((r) => [
    r.workDate.toISOString().slice(0, 10),
    r.patientName,
    r.patientPhone,
    r.doctorName,
    followUpServiceLabel(r.serviceCategory),
    r.satisfactionDoctor ?? '',
    r.satisfactionAssistants ?? '',
    r.satisfactionReception ?? '',
    followUpOutcomeLabel(r.outcome),
    statusSummary(r),
    r.followUpDate?.toISOString().slice(0, 10) ?? '',
    r.notes || '',
  ]);
}

export function buildFollowUpCsv(rows: FollowUpCase[]): Buffer {
  const lines = [
    FOLLOW_UP_HEADERS.join(','),
    ...followUpRowsForExport(rows).map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');
}

export async function buildFollowUpXlsx(rows: FollowUpCase[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('فالوآپ', { views: [{ rightToLeft: true }] });
  sheet.addRow(FOLLOW_UP_HEADERS);
  sheet.getRow(1).font = { bold: true };
  for (const row of followUpRowsForExport(rows)) {
    sheet.addRow(row);
  }
  sheet.columns.forEach((c) => {
    c.width = 18;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function buildFollowUpReportPdfHtml(rows: FollowUpCase[], title: string): string {
  const tableRows = rows
    .map(
      (r) => `<tr>
      <td>${r.patientName}</td>
      <td>${r.patientPhone}</td>
      <td>${followUpServiceLabel(r.serviceCategory)}</td>
      <td>${statusSummary(r)}</td>
    </tr>`,
    )
    .join('');
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/>
<title>${title}</title>
<style>body{font-family:Tahoma,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}
th,td{border:1px solid #ccc;padding:8px;text-align:right}th{background:#f0fdfa}</style></head>
<body><h1>${title}</h1><p>تعداد: ${rows.length.toLocaleString('fa-IR')}</p>
<table><thead><tr><th>بیمار</th><th>تماس</th><th>بخش</th><th>وضعیت</th></tr></thead>
<tbody>${tableRows}</tbody></table></body></html>`;
}
