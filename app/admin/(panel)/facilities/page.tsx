"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { FormSelect } from "@/components/ui/Card";
import { fetchAdminCommerce, patchAdminCommerce } from "@/lib/commerce/client";
import { zohalCreditStatusLabel } from "@/lib/zohal/run-credit-check";
import { useEffect, useState } from "react";

type FacilityRequest = Record<string, unknown> & {
  id?: string;
  name?: string;
  phone?: string;
  nationalId?: string;
  amount?: string | number;
  description?: string;
  status?: string;
  zohalStatus?: string;
  zohalSummary?: string;
  zohalShahkarMatched?: boolean | null;
};

export default function AdminFacilitiesPage() {
  const [items, setItems] = useState<FacilityRequest[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    return fetchAdminCommerce<{ items: FacilityRequest[] }>("/api/admin/commerce/facilities")
      .then((data) => setItems(data.items))
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    void reload();
  }, []);

  function updateStatus(id: string | undefined, status: string) {
    if (!id || busyId) return;
    setError("");
    setSuccess("");
    setBusyId(id);
    void patchAdminCommerce("/api/admin/commerce/facilities", { id, status })
      .then(() => reload())
      .then(() => setSuccess("وضعیت درخواست به‌روز شد."))
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusyId(null));
  }

  function zohalLabel(r: FacilityRequest) {
    return zohalCreditStatusLabel(r.zohalStatus);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {success}
        </p>
      ) : null}
      <p className="text-sm leading-7 text-slate-600">
        <strong>تسهیلات تجهیزات فروشگاه</strong> — جدا از وام درمانی عضویت. وام عضویت را در{" "}
        <a href="/admin/memberships" className="font-bold text-teal-700 underline">
          /admin/memberships
        </a>{" "}
        بررسی کنید. پس از تأیید اینجا، طرح اقساط برای بیمار در «اقساط من» ساخته می‌شود.
      </p>
      <AdminTable
        headers={["نام", "موبایل", "کد ملی", "مبلغ", "زحل", "خلاصه استعلام", "وضعیت", "عملیات"]}
        empty="درخواست تسهیلات تجهیزات ثبت نشده. (وام عضویت اینجا نیست — /admin/memberships)"
      >
        {items.map((r) => (
          <tr key={String(r.id)} className="border-t border-slate-100 align-top">
            <td className="px-4 py-3">{String(r.name || "—")}</td>
            <td className="px-4 py-3 font-mono text-xs">{String(r.phone || "—")}</td>
            <td className="px-4 py-3 font-mono text-xs">{String(r.nationalId || "—")}</td>
            <td className="px-4 py-3">{String(r.amount || "—")}</td>
            <td className="px-4 py-3 text-xs font-medium">
              <span
                className={
                  r.zohalStatus === "partial"
                    ? "text-amber-700"
                    : r.zohalStatus === "failed" || r.zohalStatus === "error"
                      ? "text-rose-700"
                      : r.zohalStatus === "passed"
                        ? "text-teal-700"
                        : ""
                }
              >
                {zohalLabel(r)}
              </span>
            </td>
            <td className="max-w-xs px-4 py-3 text-xs leading-5 whitespace-pre-line text-slate-600">
              {r.zohalSummary || "—"}
            </td>
            <td className="px-4 py-3">
              <AdminBadge
                tone={
                  r.status === "approved"
                    ? "success"
                    : r.status === "rejected"
                      ? "danger"
                      : "warn"
                }
              >
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
                disabled={busyId === r.id}
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
