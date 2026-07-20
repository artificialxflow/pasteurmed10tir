"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { FormSelect } from "@/components/ui/Card";
import { PasteurStorage } from "@/lib/storage";
import { useEffect, useState } from "react";

type PartnerRequest = Record<string, unknown> & {
  id: string;
  name?: string;
  phone?: string;
  typeLabel?: string;
  specialty?: string;
  city?: string;
  description?: string;
  status?: string;
};

const statusMeta: Record<string, { label: string; tone: "success" | "warn" | "danger" | "info" }> = {
  new: { label: "جدید", tone: "warn" },
  pending: { label: "جدید", tone: "warn" },
  reviewing: { label: "در حال بررسی", tone: "info" },
  approved: { label: "تایید شده", tone: "success" },
  rejected: { label: "رد شده", tone: "danger" },
};

export default function AdminPartnersPage() {
  const [items, setItems] = useState<PartnerRequest[]>([]);

  function reload() {
    setItems(PasteurStorage.getPartnerRequests() as PartnerRequest[]);
  }

  useEffect(() => {
    reload();
  }, []);

  function updateStatus(id: string, status: string) {
    PasteurStorage.updatePartnerRequest(id, { status });
    reload();
  }

  return (
    <AdminTable
      headers={["متقاضی", "نوع همکاری", "تخصص", "شهر", "توضیحات", "وضعیت", "عملیات"]}
      empty="هنوز درخواست همکاری ثبت نشده است."
    >
      {items.map((request) => {
        const status = statusMeta[String(request.status || "new")] || statusMeta.new;
        return (
          <tr key={request.id} className="border-t border-slate-100">
            <td className="px-4 py-3">
              {String(request.name || "—")}
              <br />
              <span className="text-xs text-slate-500">{String(request.phone || "—")}</span>
            </td>
            <td className="px-4 py-3">{String(request.typeLabel || "—")}</td>
            <td className="px-4 py-3">{String(request.specialty || "—")}</td>
            <td className="px-4 py-3">{String(request.city || "—")}</td>
            <td className="max-w-xs truncate px-4 py-3 text-xs">
              {String(request.description || "—")}
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={status.tone}>{status.label}</AdminBadge>
            </td>
            <td className="px-4 py-3">
              <FormSelect
                className="py-1 text-xs"
                value={String(request.status || "new")}
                onChange={(e) => updateStatus(request.id, e.target.value)}
              >
                <option value="new">جدید</option>
                <option value="reviewing">در حال بررسی</option>
                <option value="approved">تایید شده</option>
                <option value="rejected">رد شده</option>
              </FormSelect>
            </td>
          </tr>
        );
      })}
    </AdminTable>
  );
}
