"use client";

import { Card } from "@/components/ui/Card";
import { staffCommissionSourceLabel, staffCommissionStatusLabel } from "@/lib/home-visit/labels";
import { fetchPatientOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  commissionAmount: number;
  status?: string;
  sourceType?: string;
  sourceLabel?: string | null;
  createdAt: string;
};

export function FieldStaffCommissionsCard() {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchPatientOps<{ item: unknown; items: Row[] }>("/api/operations/field-staff/me/commissions")
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
      <p className="text-sm font-extrabold text-slate-900">پورسانت‌های من</p>
      <p className="text-xs leading-6 text-slate-500">
        فقط مشاهده. تسویه از پنل ادمین انجام می‌شود. برای پزشکان و کادر میدانی با همان موبایل ورود.
      </p>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">هنوز پورسانتی ثبت نشده است.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-xs">
              <div>
                <p className="font-bold text-slate-800">{staffCommissionSourceLabel(item.sourceType)}</p>
                <p className="mt-0.5 text-slate-500">
                  {formatJalaliDate(item.createdAt)}
                  {item.sourceLabel ? ` · ${item.sourceLabel}` : ""}
                </p>
              </div>
              <div className="text-left">
                <p className="font-extrabold text-teal-800">{formatPrice(item.commissionAmount)}</p>
                <p className="mt-0.5 text-slate-500">{staffCommissionStatusLabel(item.status)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
