"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { Card, FormLabel, FormSelect } from "@/components/ui/Card";
import { fieldStaffKindLabel } from "@/lib/home-visit/labels";
import { fetchAdminOps } from "@/lib/operations/client";
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
  createdAt: string;
};

export default function AdminStaffCommissionsPage() {
  const [items, setItems] = useState<StaffCommissionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [kind, setKind] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const params = new URLSearchParams();
    if (kind === "nurse" || kind === "physician") params.set("kind", kind);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    const data = await fetchAdminOps<{ items: StaffCommissionRow[]; total: number }>(
      `/api/admin/operations/staff-commissions${qs ? `?${qs}` : ""}`,
    );
    setItems(data.items);
    setTotal(Number(data.total || 0));
  }, [kind, from, to]);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Card hover={false} className="border-teal-100 bg-teal-50/70 p-4 text-sm leading-7 text-slate-700">
        <p className="font-extrabold text-teal-900">پورسانت پرستار / پزشک اعزام</p>
        <p>
          بعد از وضعیت «انجام‌شده»، درصد ثبت‌شده روی همان نیرو × مبلغ همان درخواست اعزام محاسبه
          می‌شود. این گزارش جدا از پورسانت ویزیتور است.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <FormLabel>نوع نیرو</FormLabel>
          <FormSelect value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">همه</option>
            <option value="nurse">پرستار</option>
            <option value="physician">پزشک</option>
          </FormSelect>
        </div>
        <div>
          <FormLabel>از تاریخ</FormLabel>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <FormLabel>تا تاریخ</FormLabel>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <Card hover={false} className="p-4">
          <p className="text-2xl font-bold text-teal-700">{formatPrice(total)}</p>
          <p className="text-sm text-slate-500">جمع پورسانت</p>
        </Card>
      </div>

      <AdminTable
        headers={["نیرو", "نوع", "درخواست", "مبلغ پایه", "درصد", "پورسانت", "تاریخ"]}
        empty="پورسانت نیرویی ثبت نشده."
      >
        {items.map((item) => (
          <tr key={item.id} className="border-t border-slate-100">
            <td className="px-4 py-3 font-bold">{item.staffName}</td>
            <td className="px-4 py-3">{fieldStaffKindLabel(item.staffKind)}</td>
            <td className="px-4 py-3 font-mono text-xs">{item.requestId}</td>
            <td className="px-4 py-3">{formatPrice(item.amount)}</td>
            <td className="px-4 py-3">{item.commissionRate.toLocaleString("fa-IR")}٪</td>
            <td className="px-4 py-3 font-bold text-teal-700">{formatPrice(item.commissionAmount)}</td>
            <td className="px-4 py-3 text-xs">{formatJalaliDate(item.createdAt)}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
