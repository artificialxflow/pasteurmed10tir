"use client";

import { Card } from "@/components/ui/Card";
import { buildMapsUrl } from "@/lib/home-visit/geo";
import { homeVisitKindLabel, homeVisitStatusLabel } from "@/lib/home-visit/labels";
import { fetchPatientOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { useEffect, useState } from "react";

type Job = {
  id: string;
  kind: string;
  status: string;
  serviceTitle?: string;
  specialtyLabel?: string;
  description?: string;
  patientName?: string;
  patientPhone?: string;
  patientAreaLabel?: string;
  patientAddress?: string;
  latitude?: number;
  longitude?: number;
  hasPatientLocation?: boolean;
  createdAt: string;
};

function formatTelHref(phone?: string): string | null {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("98")) return `tel:+${digits}`;
  if (digits.startsWith("0")) return `tel:${digits}`;
  return `tel:0${digits}`;
}

function JobRow({ item }: { item: Job }) {
  const telHref = formatTelHref(item.patientPhone);
  const mapsUrl =
    item.latitude != null && item.longitude != null
      ? buildMapsUrl(item.latitude, item.longitude)
      : null;
  const serviceLabel = item.serviceTitle || item.specialtyLabel;

  return (
    <li className="rounded-xl border border-slate-100 px-3 py-3 text-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-bold text-slate-800">
          {homeVisitKindLabel(item.kind)} · {homeVisitStatusLabel(item.status)}
        </p>
        <span className="text-[10px] font-semibold text-slate-400">{item.id}</span>
      </div>

      <p className="mt-1 text-slate-500">
        {formatJalaliDate(item.createdAt)}
        {item.patientName ? ` · ${item.patientName}` : ""}
        {serviceLabel ? ` · ${serviceLabel}` : ""}
      </p>

      <div className="mt-3 space-y-1.5 rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2">
        {item.patientAreaLabel ? (
          <p>
            <span className="font-bold text-slate-700">منطقه: </span>
            <span className="text-slate-800">{item.patientAreaLabel}</span>
          </p>
        ) : null}
        {item.patientAddress ? (
          <p className="leading-6 text-slate-800">
            <span className="font-bold text-slate-700">آدرس: </span>
            {item.patientAddress}
          </p>
        ) : (
          <p className="text-amber-700">آدرس در پرونده ثبت نشده است.</p>
        )}
        {item.patientPhone ? (
          <p>
            <span className="font-bold text-slate-700">تماس بیمار: </span>
            {telHref ? (
              <a href={telHref} className="font-bold text-teal-700 underline-offset-2 hover:underline">
                {item.patientPhone}
              </a>
            ) : (
              item.patientPhone
            )}
          </p>
        ) : null}
        {item.description ? (
          <p className="leading-6 text-slate-600">
            <span className="font-bold text-slate-700">توضیحات: </span>
            {item.description}
          </p>
        ) : null}
      </div>

      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center rounded-lg bg-teal-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-800"
        >
          مسیریابی روی نقشه
        </a>
      ) : item.patientAddress ? (
        <p className="mt-2 text-[11px] text-slate-500">موقعیت دقیق روی نقشه ثبت نشده — از آدرس متنی استفاده کنید.</p>
      ) : null}
    </li>
  );
}

export function FieldStaffJobsCard() {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<Job[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchPatientOps<{ item: unknown; items: Job[] }>("/api/operations/field-staff/me/jobs")
      .then((data) => {
        if (!data.item) {
          setVisible(false);
          return;
        }
        setVisible(true);
        setItems(data.items || []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (!visible) return null;

  return (
    <Card hover={false} className="space-y-3 p-4">
      <div>
        <p className="text-sm font-extrabold text-slate-900">کارکرد / اعزام‌های من</p>
        <p className="mt-1 text-xs leading-6 text-slate-500">
          آدرس، تماس بیمار و مسیریابی هر اعزام تخصیص‌داده‌شده اینجا نمایش داده می‌شود.
        </p>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">اعزام تخصیص‌داده‌شده‌ای نیست.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <JobRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </Card>
  );
}
