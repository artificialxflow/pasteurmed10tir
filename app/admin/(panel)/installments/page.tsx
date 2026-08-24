"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Card";
import { fetchAdminCommerce, postAdminCommerce } from "@/lib/commerce/client";
import {
  formatJalaliDate,
  installmentSourceLabel,
  remainingInstallment,
  type InstallmentPlan,
} from "@/lib/patient";
import { formatPrice } from "@/lib/utils";
import { Fragment, useEffect, useMemo, useState } from "react";

export default function AdminInstallmentsPage() {
  const [items, setItems] = useState<InstallmentPlan[]>([]);
  const [rawItems, setRawItems] = useState<InstallmentPlan[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    return Promise.all([
      fetchAdminCommerce<{ items: InstallmentPlan[] }>("/api/admin/commerce/installments"),
      fetchAdminCommerce<{ items: InstallmentPlan[] }>("/api/admin/commerce/installments?raw=1"),
    ]).then(([visible, raw]) => {
      setItems(visible.items);
      setRawItems(raw.items);
    });
  }

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (sourceFilter === "all") return items;
    if (sourceFilter === "legacy-membership") {
      return rawItems.filter((p) => p.source === "membership" || p.status === "hidden");
    }
    return items.filter((p) => p.source === sourceFilter);
  }, [items, rawItems, sourceFilter]);

  async function manualPay(planId: string, scheduleItemId: string, amount: number) {
    setError("");
    setSuccess("");
    setBusyId(scheduleItemId);
    try {
      await postAdminCommerce("/api/admin/commerce/installments/manual-pay", {
        planId,
        scheduleItemId,
        amount,
        note: manualNote.trim() || undefined,
      });
      setSuccess("واریز دستی ثبت شد.");
      setManualNote("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ثبت ناموفق");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-teal-700">{success}</p> : null}
      <p className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3 text-xs leading-6 text-slate-700">
        وام عضویت ≠ تسهیلات تجهیزات ≠ سقف کیف اعتبار — هر کدام طرح اقساط جدا دارند. از اینجا می‌توانید
        واریز حضوری را روی یک قسط ثبت کنید.
      </p>
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
          <option value="loan">وام</option>
          <option value="legacy-membership">منسوخ / عضویت</option>
        </select>
      </div>
      <AdminTable
        headers={["بیمار", "عنوان", "کل", "پرداخت‌شده", "مانده", "منبع", "جزئیات"]}
        empty="طرح اقساطی نیست."
      >
        {filtered.map((p) => (
          <Fragment key={p.id}>
            <tr className="border-t border-slate-100">
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
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="text-xs font-bold text-cyan-800"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                >
                  {expandedId === p.id ? "بستن" : "باز کردن"}
                </button>
              </td>
            </tr>
            {expandedId === p.id ? (
              <tr className="border-t border-slate-50 bg-slate-50/50">
                <td colSpan={7} className="px-4 py-4">
                  <div className="mb-3 max-w-md">
                    <FormInput
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      placeholder="توضیح واریز دستی (اختیاری)"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2 text-xs">
                    {(p.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <span>
                          قسط {item.index} · {formatJalaliDate(item.dueDate)} ·{" "}
                          {formatPrice(item.amount)} · {item.status}
                          {item.remaining > 0 ? ` · مانده ${formatPrice(item.remaining)}` : ""}
                        </span>
                        {item.status !== "paid" && item.remaining > 0 ? (
                          <Button
                            type="button"
                            className="px-3 py-1 text-[0.65rem]"
                            disabled={busyId === item.id}
                            onClick={() => void manualPay(p.id, item.id, item.remaining)}
                          >
                            ثبت واریز دستی
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    {!p.items?.length ? (
                      <p className="text-slate-500">لیست قسط خالی است (پس از migrate heal می‌شود).</p>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </AdminTable>
    </div>
  );
}
