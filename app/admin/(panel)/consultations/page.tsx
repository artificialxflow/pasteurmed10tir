"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { PasteurStorage } from "@/lib/storage";
import { useEffect, useState } from "react";

type Consultation = Record<string, unknown> & {
  id: string;
  name?: string;
  phone?: string;
  typeLabel?: string;
  categoryLabel?: string;
  specialtyLabel?: string;
  doctorName?: string;
  description?: string;
  estimate?: string;
  amount?: number;
  status?: string;
};

export default function AdminConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);

  function reload() {
    setItems(PasteurStorage.getConsultations() as Consultation[]);
  }

  useEffect(() => {
    reload();
  }, []);

  function markAnswered(id: string) {
    PasteurStorage.updateConsultation(id, { status: "answered" });
    reload();
  }

  return (
    <AdminTable
      headers={[
        "نام",
        "موبایل",
        "نوع",
        "دسته",
        "تخصص",
        "پزشک",
        "شرح",
        "مبلغ",
        "وضعیت",
        "عملیات",
      ]}
      empty="درخواست مشاوره‌ای ثبت نشده."
    >
      {items.map((c) => (
        <tr key={c.id} className="border-t border-slate-100">
          <td className="px-4 py-3">{String(c.name || "—")}</td>
          <td className="px-4 py-3">{String(c.phone || "—")}</td>
          <td className="px-4 py-3">{String(c.typeLabel || "—")}</td>
          <td className="px-4 py-3">{String(c.categoryLabel || "—")}</td>
          <td className="px-4 py-3">{String(c.specialtyLabel || "—")}</td>
          <td className="px-4 py-3">{String(c.doctorName || "—")}</td>
          <td className="max-w-xs truncate px-4 py-3 text-xs">
            {String(c.description || "—")}
          </td>
          <td className="px-4 py-3">
            {Number(c.amount || 0).toLocaleString("fa-IR")}
            {c.estimate ? (
              <>
                <br />
                <span className="text-xs text-slate-500">{String(c.estimate)}</span>
              </>
            ) : null}
          </td>
          <td className="px-4 py-3">
            <AdminBadge tone={c.status === "answered" ? "success" : "warn"}>
              {c.status === "answered" ? "پاسخ داده" : "در انتظار"}
            </AdminBadge>
          </td>
          <td className="px-4 py-3">
            {c.status !== "answered" ? (
              <button
                type="button"
                className="text-xs font-semibold text-teal-700"
                onClick={() => markAnswered(String(c.id))}
              >
                علامت پاسخ
              </button>
            ) : (
              "—"
            )}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
