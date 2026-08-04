"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { fetchAdminOps, patchAdminOps } from "@/lib/operations/client";
import { useCallback, useEffect, useState } from "react";

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
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchAdminOps<{ items: Consultation[] }>(
      "/api/admin/operations/consultations",
    );
    setItems(data.items);
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  function markAnswered(id: string) {
    void patchAdminOps("/api/admin/operations/consultations", { id, status: "answered" })
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
    </div>
  );
}
