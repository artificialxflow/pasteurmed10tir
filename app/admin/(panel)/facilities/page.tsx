"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { FormSelect } from "@/components/ui/Card";
import { fetchAdminCommerce, patchAdminCommerce } from "@/lib/commerce/client";
import { useEffect, useState } from "react";

type FacilityRequest = Record<string, unknown> & {
  id?: string;
  name?: string;
  phone?: string;
  amount?: string | number;
  description?: string;
  status?: string;
};

export default function AdminFacilitiesPage() {
  const [items, setItems] = useState<FacilityRequest[]>([]);
  const [error, setError] = useState("");

  function reload() {
    void fetchAdminCommerce<{ items: FacilityRequest[] }>("/api/admin/commerce/facilities")
      .then((data) => setItems(data.items))
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  function updateStatus(id: string | undefined, status: string) {
    if (!id) return;
    void patchAdminCommerce("/api/admin/commerce/facilities", { id, status })
      .then(() => reload())
      .catch((e: Error) => setError(e.message));
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <AdminTable
        headers={["نام", "موبایل", "مبلغ تقریبی", "توضیحات", "وضعیت", "عملیات"]}
        empty="درخواست تسهیلاتی ثبت نشده است."
      >
        {items.map((r) => (
          <tr key={String(r.id)} className="border-t border-slate-100">
            <td className="px-4 py-3">{String(r.name || "—")}</td>
            <td className="px-4 py-3">{String(r.phone || "—")}</td>
            <td className="px-4 py-3">{String(r.amount || "—")}</td>
            <td className="max-w-xs truncate px-4 py-3 text-xs">
              {String(r.description || "—")}
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={r.status === "approved" ? "success" : "warn"}>
                {r.status === "approved"
                  ? "تأیید شده"
                  : r.status === "rejected"
                    ? "رد شده"
                    : "در بررسی"}
              </AdminBadge>
            </td>
            <td className="px-4 py-3">
              <FormSelect
                className="py-1 text-xs"
                value={String(r.status || "pending")}
                onChange={(e) => updateStatus(r.id ? String(r.id) : undefined, e.target.value)}
              >
                <option value="pending">در بررسی</option>
                <option value="approved">تأیید</option>
                <option value="rejected">رد</option>
              </FormSelect>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
