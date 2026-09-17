"use client";

import { payloadDisplayRows, sectionUploadHint, type HealthSectionId } from "@/lib/health-record/sections";
import { formatJalaliDate } from "@/lib/patient";

type Entry = {
  id: string;
  section: string;
  date: string;
  payload: Record<string, unknown>;
  attachments?: Array<{ id: string; path: string; originalName: string }>;
};

export function HealthRecordEntryView({
  item,
  section,
  onUpload,
  title,
}: {
  item: Entry;
  section: HealthSectionId;
  onUpload?: (entryId: string, file: File | null) => void;
  title?: string;
}) {
  const rows = payloadDisplayRows(item.section, item.payload);
  const doctor = String(item.payload?.doctorName || "").trim();

  return (
    <li className="rounded-xl border border-slate-100 p-3 text-sm">
      <p className="font-bold text-slate-900">
        {title ? `${title} · ` : ""}
        {formatJalaliDate(item.date)}
      </p>
      {doctor ? <p className="mt-1 text-xs font-bold text-teal-800">پزشک: {doctor}</p> : null}
      <dl className="mt-2 space-y-1 text-xs leading-6 text-slate-700">
        {rows
          .filter((row) => row.label !== "نام پزشک" && row.label !== "نام دندانپزشک" && row.label !== "نام پزشک / ثبت‌کننده" && row.label !== "نام ثبت‌کننده")
          .map((row) => (
            <div key={row.label}>
              <dt className="font-bold text-slate-500">{row.label}</dt>
              <dd className="whitespace-pre-wrap">{row.value}</dd>
            </div>
          ))}
      </dl>
      {(item.attachments || []).length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs">
          {item.attachments!.map((a) => (
            <li key={a.id}>
              <a className="text-teal-700 underline" href={a.path} target="_blank" rel="noreferrer">
                {a.originalName || a.path}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {onUpload ? (
        <label className="mt-2 block text-xs font-bold text-slate-600">
          {sectionUploadHint(section)}
          <input
            type="file"
            accept="image/*,.pdf"
            className="mt-1 block w-full text-xs"
            onChange={(ev) => onUpload(item.id, ev.target.files?.[0] || null)}
          />
        </label>
      ) : null}
    </li>
  );
}
