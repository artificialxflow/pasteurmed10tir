"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Card } from "@/components/ui/Card";
import { fetchAdminCommerce, patchAdminCommerce } from "@/lib/commerce/client";
import { commissionBasisLabel, commissionSourceTypeLabel } from "@/lib/commission";
import { type Commission } from "@/lib/storage";
import { useEffect, useState } from "react";

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [error, setError] = useState("");

  function reload() {
    void fetchAdminCommerce<{ items: Commission[] }>("/api/admin/commerce/commissions")
      .then((data) => setCommissions(data.items))
      .catch((e: Error) => setError(e.message));
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
    void patchAdminCommerce("/api/admin/commerce/commissions", { id, status: "paid" })
      .then(() => reload())
      .catch((e: Error) => setError(e.message));
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Card hover={false} className="border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-7 text-slate-700">
        <p className="font-extrabold text-cyan-900">مبنای محاسبه (تا قفل کارفرما)</p>
        <p>
          پورسانت = درصد ویزیتور × <strong>مبلغ همان تراکنش</strong> که کد معرف روی آن ثبت شده
          (رزرو ≈ مبلغ درگاه؛ عضویت/VIP ≈ حق عضویت پرداخت‌شده).
        </p>
      </Card>

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
          "مبنا",
          "مشتری",
          "مبلغ پایه",
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
            <td className="px-4 py-3">
              {commissionSourceTypeLabel(c.sourceType)}
              {c.sourceLabel ? (
                <span className="mt-0.5 block text-xs text-slate-500">{c.sourceLabel}</span>
              ) : null}
            </td>
            <td className="px-4 py-3 text-xs">{commissionBasisLabel(c.sourceType)}</td>
            <td className="px-4 py-3">
              {c.customerName}
              <div className="text-xs text-slate-500">{c.customerPhone}</div>
            </td>
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
                  className="text-xs font-bold text-teal-700"
                  onClick={() => markPaid(String(c.id))}
                >
                  علامت پرداخت
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
