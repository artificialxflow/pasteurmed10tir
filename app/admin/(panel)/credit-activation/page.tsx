"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { FormSelect } from "@/components/ui/Card";
import {
  deleteAdminCommerce,
  fetchAdminCommerce,
  patchAdminCommerce,
} from "@/lib/commerce/client";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";

type CreditActivation = {
  id?: string;
  phone?: string;
  patientName?: string;
  nationalId?: string;
  requestedAmount?: number;
  installmentCount?: number;
  status?: string;
  reviewNote?: string | null;
  linkedPlanId?: string;
  createdAt?: string;
};

export default function AdminCreditActivationPage() {
  const [items, setItems] = useState<CreditActivation[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    return fetchAdminCommerce<{ items: CreditActivation[] }>("/api/admin/commerce/credit-activation")
      .then((data) => setItems(data.items))
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    void reload();
  }, []);

  function deleteRequest(row: CreditActivation) {
    const id = row.id ? String(row.id) : "";
    if (!id || busyId) return;
    const name = String(row.patientName || row.phone || id);
    if (
      !window.confirm(
        `درخواست فعال‌سازی «${name}» حذف شود؟\n\nطرح اقساط مرتبط هم از لیست اقساط ناپدید می‌شود. سابقه در دیتابیس می‌ماند.`,
      )
    ) {
      return;
    }
    setBusyId(id);
    setError("");
    setSuccess("");
    void deleteAdminCommerce<{ message?: string }>(
      `/api/admin/commerce/credit-activation/${encodeURIComponent(id)}`,
    )
      .then((res) => {
        setSuccess(res.message || "درخواست فعال‌سازی حذف شد.");
        return reload();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusyId(null));
  }

  function updateStatus(id: string | undefined, status: string) {
    if (!id || busyId) return;
    let reviewNote: string | undefined;
    if (status === "rejected") {
      const note = window.prompt("توضیح رد برای بیمار (الزامی):");
      if (note == null) return;
      if (!note.trim()) {
        setError("برای رد درخواست، نوشتن توضیح الزامی است.");
        return;
      }
      reviewNote = note.trim();
    }
    setBusyId(id);
    setError("");
    setSuccess("");
    void patchAdminCommerce<{ item: CreditActivation }>(
      `/api/admin/commerce/credit-activation/${encodeURIComponent(id)}`,
      { status, ...(reviewNote ? { reviewNote } : {}) },
    )
      .then(() => reload())
      .then(() =>
        setSuccess(
          status === "approved"
            ? "درخواست تأیید شد و طرح اقساط روی مبلغ درخواستی ساخته شد."
            : status === "rejected"
              ? "درخواست رد شد و توضیح برای بیمار ثبت شد."
              : "وضعیت درخواست به‌روز شد.",
        ),
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusyId(null));
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
        <strong>فعال‌سازی کارت اعتباری</strong> — سقف اعتبار با خرید عضویت داده می‌شود؛ قسط‌بندی
        فقط بعد از تأیید اینجا و روی <strong>مبلغ درخواستی بیمار</strong> ساخته می‌شود، نه کل سقف.
        وام درمانی در{" "}
        <a href="/admin/memberships" className="font-bold text-teal-700 underline">
          /admin/memberships
        </a>{" "}
        است.
      </p>
      <AdminTable
        headers={["نام", "موبایل", "کد ملی", "مبلغ / اقساط", "وضعیت", "عملیات"]}
        empty="درخواست فعال‌سازی اعتبار ثبت نشده."
      >
        {items.map((row) => (
          <tr key={String(row.id)} className="border-t border-slate-100 align-top">
            <td className="px-4 py-3">{String(row.patientName || "—")}</td>
            <td className="px-4 py-3 font-mono text-xs">{String(row.phone || "—")}</td>
            <td className="px-4 py-3 font-mono text-xs">{String(row.nationalId || "—")}</td>
            <td className="px-4 py-3">
              {formatPrice(Number(row.requestedAmount || 0))}
              {row.installmentCount
                ? ` · ${row.installmentCount.toLocaleString("fa-IR")} قسط`
                : ""}
            </td>
            <td className="px-4 py-3">
              <AdminBadge
                tone={
                  row.status === "approved"
                    ? "success"
                    : row.status === "rejected"
                      ? "danger"
                      : "warn"
                }
              >
                {row.status === "approved"
                  ? "تأیید شده"
                  : row.status === "rejected"
                    ? "رد شده"
                    : "در بررسی"}
              </AdminBadge>
              {row.status === "rejected" && row.reviewNote ? (
                <p className="mt-2 text-xs leading-5 text-rose-800">توضیح: {row.reviewNote}</p>
              ) : null}
            </td>
            <td className="space-y-2 px-4 py-3">
              <FormSelect
                className="py-1 text-xs"
                disabled={busyId === row.id}
                value={String(row.status || "pending")}
                onChange={(e) => updateStatus(row.id ? String(row.id) : undefined, e.target.value)}
              >
                <option value="pending">در بررسی</option>
                <option value="approved">تأیید</option>
                <option value="rejected">رد</option>
              </FormSelect>
              <button
                type="button"
                className="block text-xs font-bold text-rose-700 disabled:opacity-50"
                disabled={busyId === String(row.id)}
                onClick={() => deleteRequest(row)}
              >
                حذف درخواست
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
