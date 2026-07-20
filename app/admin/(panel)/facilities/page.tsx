"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { FormSelect } from "@/components/ui/Card";
import { PasteurStorage } from "@/lib/storage";
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

  function reload() {
    setItems(PasteurStorage.getFacilityRequests() as FacilityRequest[]);
  }

  useEffect(() => {
    reload();
  }, []);

  function updateStatus(id: string | undefined, status: string, index: number) {
    if (id) {
      PasteurStorage.updateFacilityRequest(id, { status });
    } else {
      const list = PasteurStorage.getFacilityRequests() as FacilityRequest[];
      if (!list[index]) return;
      list[index] = { ...list[index], status };
      PasteurStorage.set(PasteurStorage.KEYS.facilityRequests, list);
    }
    reload();
  }

  return (
    <AdminTable
      headers={["نام", "موبایل", "مبلغ تقریبی", "توضیحات", "وضعیت", "عملیات"]}
      empty="درخواست تسهیلاتی ثبت نشده است."
    >
      {items.map((r, index) => (
        <tr key={String(r.id || index)} className="border-t border-slate-100">
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
              onChange={(e) => updateStatus(r.id ? String(r.id) : undefined, e.target.value, index)}
            >
              <option value="pending">در بررسی</option>
              <option value="approved">تأیید شده</option>
              <option value="rejected">رد شده</option>
            </FormSelect>
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
