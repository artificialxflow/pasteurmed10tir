"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { FormSelect } from "@/components/ui/Card";
import {
  fetchAdminCommerce,
  patchAdminCommerce,
  postAdminCommerce,
} from "@/lib/commerce/client";
import {
  formatZohalCheckedAt,
  ZOHAL_CREDIT_DISABLED,
  zohalCreditCheckNotice,
  zohalCreditStatusLabel,
  zohalCreditStatusTone,
} from "@/lib/zohal/run-credit-check";
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
  zohalCheckedAt?: string;
  zohalShahkarMatched?: boolean | null;
};

export default function AdminFacilitiesPage() {
  const [items, setItems] = useState<FacilityRequest[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [otpById, setOtpById] = useState<Record<string, string>>({});

  function reload() {
    return fetchAdminCommerce<{ items: FacilityRequest[] }>("/api/admin/commerce/facilities")
      .then((data) => setItems(data.items))
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    void reload();
  }, []);

  function applyCreditResult(status: string | undefined, noticeText?: string) {
    const message = noticeText || zohalCreditCheckNotice(status);
    if (status === "passed" || status === "skipped") {
      setSuccess(message);
      setNotice("");
      setError("");
    } else if (
      status === "partial" ||
      status === "otp_pending" ||
      status === ZOHAL_CREDIT_DISABLED
    ) {
      setNotice(message);
      setSuccess("");
      setError("");
    } else {
      setError(message);
      setSuccess("");
      setNotice("");
    }
  }

  function sendCreditOtp(id: string | undefined) {
    if (!id || busyId) return;
    setBusyId(id);
    setError("");
    setSuccess("");
    setNotice("");
    void postAdminCommerce<{
      item: FacilityRequest;
      zohalStatus?: string;
      notice?: string;
    }>(`/api/admin/commerce/facilities/${encodeURIComponent(id)}/credit-check`, {
      action: "send_otp",
    })
      .then((data) => {
        applyCreditResult(data.zohalStatus, data.notice);
        return reload();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusyId(null));
  }

  function verifyCreditOtp(id: string | undefined) {
    if (!id || busyId) return;
    const otp = String(otpById[id] || "").trim();
    if (!otp) {
      setError("کد OTP را وارد کنید.");
      return;
    }
    setBusyId(id);
    setError("");
    setSuccess("");
    setNotice("");
    void postAdminCommerce<{
      item: FacilityRequest;
      zohalStatus?: string;
      notice?: string;
    }>(`/api/admin/commerce/facilities/${encodeURIComponent(id)}/credit-check`, {
      action: "verify_otp",
      otp,
    })
      .then((data) => {
        applyCreditResult(data.zohalStatus, data.notice);
        setOtpById((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        return reload();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusyId(null));
  }

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
      {notice ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {notice}
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
        بررسی کنید. پس از تأیید اینجا، طرح اقساط برای بیمار در «اقساط من» ساخته می‌شود. استعلام
        اعتبار بانکی با OTP زحل انجام می‌شود.
      </p>
      <AdminTable
        headers={["نام", "موبایل", "کد ملی", "مبلغ", "زحل", "خلاصه استعلام", "وضعیت", "عملیات"]}
        empty="درخواست تسهیلات تجهیزات ثبت نشده. (وام عضویت اینجا نیست — /admin/memberships)"
      >
        {items.map((r) => {
          const tone = zohalCreditStatusTone(r.zohalStatus);
          const creditDisabled = r.zohalStatus === ZOHAL_CREDIT_DISABLED;
          return (
          <tr key={String(r.id)} className="border-t border-slate-100 align-top">
            <td className="px-4 py-3">{String(r.name || "—")}</td>
            <td className="px-4 py-3 font-mono text-xs">{String(r.phone || "—")}</td>
            <td className="px-4 py-3 font-mono text-xs">{String(r.nationalId || "—")}</td>
            <td className="px-4 py-3">{String(r.amount || "—")}</td>
            <td className="px-4 py-3 text-xs font-medium">
              <span
                className={
                  tone === "warn"
                    ? "text-amber-700"
                    : tone === "danger"
                      ? "text-rose-700"
                      : tone === "ok"
                        ? "text-teal-700"
                        : ""
                }
              >
                {zohalLabel(r)}
              </span>
            </td>
            <td className="max-w-xs px-4 py-3 text-xs leading-5 whitespace-pre-line text-slate-600">
              {r.zohalSummary || "—"}
              {r.zohalCheckedAt ? (
                <p className="mt-1 text-[11px] text-slate-400">
                  آخرین استعلام: {formatZohalCheckedAt(r.zohalCheckedAt)}
                </p>
              ) : null}
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
            <td className="px-4 py-3 space-y-2">
              <button
                type="button"
                className="block text-xs font-bold text-cyan-800 disabled:opacity-50"
                disabled={busyId === String(r.id)}
                onClick={() => sendCreditOtp(r.id ? String(r.id) : undefined)}
              >
                {r.zohalStatus === "otp_pending"
                  ? "ارسال مجدد OTP"
                  : "استعلام اعتبار (OTP)"}
              </button>
              {creditDisabled ? (
                <p className="text-[11px] leading-4 text-amber-800">
                  سرویس در پنل زحل فعال نیست. تلاش مجدد تا فعال‌سازی بی‌فایده است.
                  درخواست را از همین‌جا می‌توانید دستی تأیید کنید.
                </p>
              ) : null}
              {r.zohalStatus === "otp_pending" ? (
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="کد OTP"
                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono"
                    value={otpById[String(r.id)] || ""}
                    onChange={(e) =>
                      setOtpById((prev) => ({
                        ...prev,
                        [String(r.id)]: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="text-xs font-bold text-teal-800 disabled:opacity-50"
                    disabled={busyId === String(r.id)}
                    onClick={() => verifyCreditOtp(r.id ? String(r.id) : undefined)}
                  >
                    تأیید OTP و دریافت نتیجه
                  </button>
                </div>
              ) : null}
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
          );
        })}
      </AdminTable>
    </div>
  );
}
