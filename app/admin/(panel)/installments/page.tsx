"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { fetchAdminCommerce } from "@/lib/commerce/client";
import {
  installmentSourceLabel,
  remainingInstallment,
  type InstallmentPlan,
} from "@/lib/patient";
import { formatPrice } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function AdminInstallmentsPage() {
  const [items, setItems] = useState<InstallmentPlan[]>([]);
  const [rawItems, setRawItems] = useState<InstallmentPlan[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([
      fetchAdminCommerce<{ items: InstallmentPlan[] }>("/api/admin/commerce/installments"),
      fetchAdminCommerce<{ items: InstallmentPlan[] }>("/api/admin/commerce/installments?raw=1"),
    ])
      .then(([visible, raw]) => {
        setItems(visible.items);
        setRawItems(raw.items);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (sourceFilter === "all") return items;
    if (sourceFilter === "legacy-membership") {
      return rawItems.filter((p) => p.source === "membership" || p.status === "hidden");
    }
    return items.filter((p) => p.source === sourceFilter);
  }, [items, rawItems, sourceFilter]);

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-600">فیلتر منبع:</span>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="all">همه (فعال)</option>
          <option value="credit">اعتبار</option>
          <option value="facility">تسهیلات</option>
          <option value="legacy-membership">منسوخ / عضویت</option>
        </select>
      </div>
      <AdminTable
        headers={["بیمار", "عنوان", "کل", "پرداخت‌شده", "مانده", "منبع"]}
        empty="طرح اقساطی نیست."
      >
        {filtered.map((p) => (
          <tr key={p.id} className="border-t border-slate-100">
            <td className="px-4 py-3">
              {p.patientName || "—"}
              <div className="text-xs text-slate-500">{p.phone}</div>
            </td>
            <td className="px-4 py-3">{p.title}</td>
            <td className="px-4 py-3">{formatPrice(p.totalAmount)}</td>
            <td className="px-4 py-3">{formatPrice(p.paidAmount)}</td>
            <td className="px-4 py-3">{formatPrice(remainingInstallment(p))}</td>
            <td className="px-4 py-3">
              {installmentSourceLabel(p.source)}
              {(p.source === "membership" || p.status === "hidden") && (
                <span className="mt-0.5 block text-xs text-amber-700">منسوخ</span>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
