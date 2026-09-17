"use client";

import { Card } from "@/components/ui/Card";
import { homeVisitKindLabel, homeVisitStatusLabel } from "@/lib/home-visit/labels";
import { fetchPatientOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { useEffect, useState } from "react";

type Job = {
  id: string;
  kind: string;
  status: string;
  serviceTitle?: string;
  patientName?: string;
  patientPhone?: string;
  createdAt: string;
};

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
      <p className="text-sm font-extrabold text-slate-900">کارکرد / اعزام‌های من</p>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">اعزام تخصیص‌داده‌شده‌ای نیست.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-100 px-3 py-2 text-xs">
              <p className="font-bold text-slate-800">
                {homeVisitKindLabel(item.kind)} · {homeVisitStatusLabel(item.status)}
              </p>
              <p className="mt-0.5 text-slate-500">
                {formatJalaliDate(item.createdAt)}
                {item.patientName ? ` · ${item.patientName}` : ""}
                {item.serviceTitle ? ` · ${item.serviceTitle}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
