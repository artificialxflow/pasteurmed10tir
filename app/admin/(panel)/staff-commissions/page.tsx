"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormLabel, FormSelect } from "@/components/ui/Card";
import { JalaliCalendarField } from "@/components/ui/JalaliCalendarField";
import {
  fieldStaffKindLabel,
  staffCommissionSourceLabel,
  staffCommissionStatusLabel,
} from "@/lib/home-visit/labels";
import { downloadAdminOpsExport, fetchAdminOps, patchAdminOps } from "@/lib/operations/client";
import { formatJalaliDate } from "@/lib/patient";
import { formatPrice } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

type StaffCommissionRow = {
  id: string;
  staffName: string;
  staffKind: string;
  requestId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status?: string;
  paidAt?: string | null;
  sourceType?: string;
  sourceLabel?: string | null;
  createdAt: string;
};

type Summary = {
  count: number;
  total: number;
  paidTotal: number;
  pendingTotal: number;
};

export default function AdminStaffCommissionsPage() {
  const [items, setItems] = useState<StaffCommissionRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    count: 0,
    total: 0,
    paidTotal: 0,
    pendingTotal: 0,
  });
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState<"xlsx" | "pdf" | "csv" | null>(null);

  const reload = useCallback(async () => {
    const params = new URLSearchParams();
    if (kind === "nurse" || kind === "physician" || kind === "consultant") {
      params.set("kind", kind);
    }
    if (status === "pending" || status === "approved" || status === "paid") {
      params.set("status", status);
    }
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    const data = await fetchAdminOps<{
      items: StaffCommissionRow[];
      total: number;
      summary?: Summary;
    }>(`/api/admin/operations/staff-commissions${qs ? `?${qs}` : ""}`);
    setItems(data.items);
    setSummary(
      data.summary || {
        count: data.items.length,
        total: Number(data.total || 0),
        paidTotal: data.items
          .filter((i) => i.status === "paid")
          .reduce((s, i) => s + i.commissionAmount, 0),
        pendingTotal: data.items
          .filter((i) => i.status !== "paid")
          .reduce((s, i) => s + i.commissionAmount, 0),
      },
    );
  }, [kind, status, from, to]);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  async function exportReport(format: "xlsx" | "pdf" | "csv") {
    setError("");
    setExportBusy(format);
    const stamp = new Date().toISOString().slice(0, 10);
    const params = new URLSearchParams({ format });
    if (kind === "nurse" || kind === "physician" || kind === "consultant") params.set("kind", kind);
    if (status === "pending" || status === "approved" || status === "paid") params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const path = `/api/admin/operations/staff-commissions/export?${params.toString()}`;
    try {
      if (format === "pdf") {
        window.open(path, "_blank", "noopener,noreferrer");
      } else {
        const ext = format === "xlsx" ? "xlsx" : "csv";
        await downloadAdminOpsExport(path, `staff-commissions-${stamp}.${ext}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خروجی گزارش ناموفق");
    } finally {
      setExportBusy(null);
    }
  }

  function setPayoutStatus(id: string, next: "approved" | "paid" | "pending") {
    setBusyId(id);
    void patchAdminOps("/api/admin/operations/staff-commissions", { id, status: next })
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "به‌روزرسانی ناموفق"))
      .finally(() => setBusyId(null));
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Card hover={false} className="border-teal-100 bg-teal-50/70 p-4 text-sm leading-7 text-slate-700">
        <p className="font-extrabold text-teal-900">پورسانت کادر میدانی / پزشک / مشاور</p>
        <p>
          اعزام منزل: بعد از «انجام‌شده»، درصد ثبت‌شده روی نیرو × مبلغ همان درخواست. پزشک کلینیک و
          مشاور (تغذیه/روان/مامایی): بعد از «پاسخ‌دهی» به درخواست مشاوره، با درصد پزشک یا درصد
          پیش‌فرض مشاور در تنظیمات. گردش پرداخت: در انتظار → تأیید → پرداخت‌شده.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card hover={false} className="p-4">
          <p className="text-2xl font-bold text-teal-700">{formatPrice(summary.total)}</p>
          <p className="text-sm text-slate-500">جمع در فیلتر</p>
        </Card>
        <Card hover={false} className="p-4">
          <p className="text-2xl font-bold text-green-700">{formatPrice(summary.paidTotal)}</p>
          <p className="text-sm text-slate-500">پرداخت‌شده</p>
        </Card>
        <Card hover={false} className="p-4">
          <p className="text-2xl font-bold text-amber-700">{formatPrice(summary.pendingTotal)}</p>
          <p className="text-sm text-slate-500">باقی‌مانده</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <FormLabel>نوع</FormLabel>
          <FormSelect value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">همه</option>
            <option value="nurse">پرستار</option>
            <option value="physician">پزشک</option>
            <option value="consultant">مشاور</option>
          </FormSelect>
        </div>
        <div>
          <FormLabel>وضعیت پرداخت</FormLabel>
          <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">همه</option>
            <option value="pending">در انتظار</option>
            <option value="approved">تأیید شده</option>
            <option value="paid">پرداخت‌شده</option>
          </FormSelect>
        </div>
        <JalaliCalendarField label="از تاریخ (شمسی)" value={from} onChange={setFrom} />
        <JalaliCalendarField label="تا تاریخ (شمسی)" value={to} onChange={setTo} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          disabled={exportBusy !== null}
          onClick={() => void exportReport("xlsx")}
        >
          {exportBusy === "xlsx" ? "در حال آماده‌سازی..." : "خروجی Excel"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          disabled={exportBusy !== null}
          onClick={() => void exportReport("pdf")}
        >
          {exportBusy === "pdf" ? "در حال باز کردن..." : "خروجی PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          disabled={exportBusy !== null}
          onClick={() => void exportReport("csv")}
        >
          {exportBusy === "csv" ? "در حال آماده‌سازی..." : "خروجی CSV"}
        </Button>
      </div>

      <AdminTable
        headers={[
          "نیرو / همکار",
          "نوع",
          "منبع",
          "مبلغ پایه",
          "درصد",
          "پورسانت",
          "وضعیت",
          "تاریخ",
          "عملیات",
        ]}
        empty="پورسانتی با این فیلتر نیست."
      >
        {items.map((item) => (
          <tr key={item.id} className="border-t border-slate-100">
            <td className="px-4 py-3 font-bold">{item.staffName}</td>
            <td className="px-4 py-3">{fieldStaffKindLabel(item.staffKind)}</td>
            <td className="px-4 py-3 text-xs">
              {staffCommissionSourceLabel(item.sourceType)}
              {item.sourceLabel ? (
                <span className="mt-0.5 block text-slate-500">{item.sourceLabel}</span>
              ) : null}
              <span className="mt-0.5 block font-mono text-[0.65rem] text-slate-400">
                {item.requestId}
              </span>
            </td>
            <td className="px-4 py-3">{formatPrice(item.amount)}</td>
            <td className="px-4 py-3">{item.commissionRate.toLocaleString("fa-IR")}٪</td>
            <td className="px-4 py-3 font-bold text-teal-700">
              {formatPrice(item.commissionAmount)}
            </td>
            <td className="px-4 py-3">
              <AdminBadge
                tone={
                  item.status === "paid" ? "success" : item.status === "approved" ? "info" : "warn"
                }
              >
                {staffCommissionStatusLabel(item.status)}
              </AdminBadge>
            </td>
            <td className="px-4 py-3 text-xs">
              {formatJalaliDate(item.createdAt)}
              {item.paidAt ? (
                <span className="mt-0.5 block text-slate-400">
                  پرداخت: {formatJalaliDate(item.paidAt)}
                </span>
              ) : null}
            </td>
            <td className="px-4 py-3 space-y-1 text-xs font-semibold">
              {item.status === "pending" ? (
                <button
                  type="button"
                  className="block text-cyan-800 disabled:opacity-50"
                  disabled={busyId === item.id}
                  onClick={() => setPayoutStatus(item.id, "approved")}
                >
                  تأیید برای پرداخت
                </button>
              ) : null}
              {item.status !== "paid" ? (
                <button
                  type="button"
                  className="block text-teal-700 disabled:opacity-50"
                  disabled={busyId === item.id}
                  onClick={() => setPayoutStatus(item.id, "paid")}
                >
                  علامت پرداخت‌شده
                </button>
              ) : (
                <button
                  type="button"
                  className="block text-slate-500 disabled:opacity-50"
                  disabled={busyId === item.id}
                  onClick={() => setPayoutStatus(item.id, "pending")}
                >
                  برگشت به انتظار
                </button>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
