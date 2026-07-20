"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Card } from "@/components/ui/Card";
import { PasteurStorage, type Commission } from "@/lib/storage";
import { useEffect, useState } from "react";

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);

  function reload() {
    setCommissions(PasteurStorage.getCommissions());
  }

  useEffect(() => {
    reload();
  }, []);

  const total = commissions.reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0);
  const paid = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0);
  const pending = total - paid;

  function markPaid(id: string) {
    PasteurStorage.updateCommission(id, { status: "paid" });
    reload();
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-teal-700">{total.toLocaleString("fa-IR")}</p>
          <p className="text-sm text-slate-500">کل پورسانت</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-green-700">{paid.toLocaleString("fa-IR")}</p>
          <p className="text-sm text-slate-500">پرداخت‌شده</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-2xl font-bold text-amber-700">{pending.toLocaleString("fa-IR")}</p>
          <p className="text-sm text-slate-500">در انتظار</p>
        </Card>
      </div>

      <AdminTable
        headers={[
          "ویزیتور",
          "کد",
          "منبع",
          "مشتری",
          "مبلغ",
          "درصد",
          "پورسانت",
          "وضعیت",
          "عملیات",
        ]}
        empty="پورسانتی ثبت نشده است."
      >
        {commissions.map((c) => (
          <tr key={c.id} className="border-t border-slate-100">
            <td className="px-4 py-3">{c.visitorName}</td>
            <td className="px-4 py-3 font-mono">{c.referralCode}</td>
            <td className="px-4 py-3">{c.sourceLabel}</td>
            <td className="px-4 py-3">{c.customerName}</td>
            <td className="px-4 py-3">{Number(c.amount || 0).toLocaleString("fa-IR")}</td>
            <td className="px-4 py-3">{c.commissionRate}%</td>
            <td className="px-4 py-3 font-bold text-teal-700">
              {Number(c.commissionAmount || 0).toLocaleString("fa-IR")}
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={c.status === "paid" ? "success" : "warn"}>
                {c.status === "paid" ? "پرداخت‌شده" : "در انتظار"}
              </AdminBadge>
            </td>
            <td className="px-4 py-3">
              {c.status !== "paid" ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-teal-700"
                  onClick={() => markPaid(c.id)}
                >
                  تسویه
                </button>
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
