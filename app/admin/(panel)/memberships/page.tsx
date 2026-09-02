"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput } from "@/components/ui/Card";
import {
  fetchAdminCommerce,
  patchAdminCommerce,
  postAdminCommerce,
  putAdminCommerce,
} from "@/lib/commerce/client";
import { ROUTES } from "@/lib/routes";
import { type Membership } from "@/lib/data";
import { formatToman } from "@/lib/membership";
import { type Member } from "@/lib/storage";
import {
  zohalCreditCheckNotice,
  zohalCreditStatusLabel,
} from "@/lib/zohal/run-credit-check";
import { useEffect, useState } from "react";

type Application = Record<string, unknown> & {
  id?: string;
  patientName?: string;
  planTitle?: string;
  tier?: string;
  tierLabel?: string;
  membershipDurationLabel?: string;
  validityLabel?: string;
  discountPercent?: number;
  amountRial?: number;
  referralCode?: string;
  visitorName?: string;
  phone?: string;
  nationalId?: string;
  loanAmount?: number;
  status?: string;
  zohalStatus?: string;
  zohalSummary?: string;
  zohalShahkarMatched?: boolean | null;
  reviewNote?: string | null;
};

type MemberRow = Member & { walletCeiling?: number | null };

export default function AdminMembershipsPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [plans, setPlans] = useState<Membership[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [otpById, setOtpById] = useState<Record<string, string>>({});

  async function reload() {
    try {
      const [plansData, membersData] = await Promise.all([
        fetchAdminCommerce<{ items: Membership[] }>("/api/admin/commerce/membership-plans"),
        fetchAdminCommerce<{
          members: MemberRow[];
          applications: Application[];
        }>("/api/admin/commerce/members"),
      ]);
      setPlans(plansData.items.map((p) => ({ ...p, features: [...p.features] })));
      setMembers(membersData.members);
      setApplications(membersData.applications);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function updatePlan(index: number, patch: Partial<Membership>) {
    setPlans((prev) =>
      prev.map((plan, i) => (i === index ? { ...plan, ...patch } : plan)),
    );
  }

  function savePlans() {
    const cleaned = plans.map((plan) => ({
      ...plan,
      loanLimit: Number(plan.loanLimit || 0),
      downPaymentPercent: Number(plan.downPaymentPercent || 0),
      loanTermLabel: String(plan.loanTermLabel || "").trim(),
    }));
    void putAdminCommerce<{ items: Membership[] }>("/api/admin/commerce/membership-plans", {
      items: cleaned,
    })
      .then((data) => setPlans(data.items.map((p) => ({ ...p, features: [...p.features] }))))
      .catch((e: Error) => setError(e.message));
  }

  function resetPlans() {
    void putAdminCommerce<{ items: Membership[] }>("/api/admin/commerce/membership-plans", {
      reset: true,
    })
      .then((data) => setPlans(data.items.map((p) => ({ ...p, features: [...p.features] }))))
      .catch((e: Error) => setError(e.message));
  }

  function zohalLabel(app: Application) {
    return zohalCreditStatusLabel(app.zohalStatus);
  }

  function applyCreditResult(status: string | undefined, noticeText?: string) {
    const message = noticeText || zohalCreditCheckNotice(status);
    if (status === "passed" || status === "skipped") {
      setSuccess(message);
      setNotice("");
      setError("");
    } else if (status === "partial" || status === "otp_pending") {
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
      item: Application;
      zohalStatus?: string;
      notice?: string;
    }>(
      `/api/admin/commerce/membership-applications/${encodeURIComponent(id)}/credit-check`,
      { action: "send_otp" },
    )
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
      item: Application;
      zohalStatus?: string;
      notice?: string;
    }>(
      `/api/admin/commerce/membership-applications/${encodeURIComponent(id)}/credit-check`,
      { action: "verify_otp", otp },
    )
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

  function updateApplicationStatus(id: string | undefined, status: string) {
    if (!id || busyId) return;
    let reviewNote: string | undefined;
    if (status === "rejected") {
      const note = window.prompt("توضیح رد برای وام‌گیرنده (الزامی):");
      if (note == null) return;
      if (!note.trim()) {
        setError("برای رد وام، نوشتن توضیح برای وام‌گیرنده الزامی است.");
        return;
      }
      reviewNote = note.trim();
    }
    setBusyId(id);
    setError("");
    setSuccess("");
    void patchAdminCommerce<{ item: Application }>(
      `/api/admin/commerce/membership-applications/${encodeURIComponent(id)}`,
      { status, ...(reviewNote ? { reviewNote } : {}) },
    )
      .then(() => reload())
      .then(() =>
        setSuccess(
          status === "rejected"
            ? "درخواست رد شد و توضیح برای وام‌گیرنده ثبت شد."
            : "وضعیت درخواست به‌روز شد.",
        ),
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusyId(null));
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {notice ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {notice}
        </p>
      ) : null}
      {success ? <p className="text-sm text-teal-700">{success}</p> : null}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">فرم‌های پیشنهاد صدور عضویت (وام درمانی)</h2>
          <p className="text-xs text-slate-500">
            تسهیلات تجهیزات →{" "}
            <a href={ROUTES.admin.facilities} className="font-bold text-cyan-800 underline">
              /admin/facilities
            </a>
          </p>
        </div>
        <AdminTable
          headers={[
            "مشتری",
            "کد ملی",
            "مبلغ وام",
            "طرح",
            "زحل",
            "خلاصه",
            "وضعیت",
            "عملیات",
          ]}
          empty="فرم عضویتی ثبت نشده است."
        >
          {applications.map((app) => (
            <tr key={String(app.id)} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3">
                {String(app.patientName || "—")}
                <div className="font-mono text-xs text-slate-500">{String(app.phone || "—")}</div>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{String(app.nationalId || "—")}</td>
              <td className="px-4 py-3">
                {app.loanAmount
                  ? `${Number(app.loanAmount).toLocaleString("fa-IR")} تومان`
                  : "—"}
              </td>
              <td className="px-4 py-3">{String(app.planTitle || "—")}</td>
              <td className="px-4 py-3 text-xs font-medium">
                <span
                  className={
                    app.zohalStatus === "partial" || app.zohalStatus === "otp_pending"
                      ? "text-amber-700"
                      : app.zohalStatus === "failed" || app.zohalStatus === "error"
                        ? "text-rose-700"
                        : app.zohalStatus === "passed"
                          ? "text-teal-700"
                          : ""
                  }
                >
                  {zohalLabel(app)}
                </span>
              </td>
              <td className="max-w-xs px-4 py-3 text-xs leading-5 whitespace-pre-line text-slate-600">
                {app.zohalSummary || "—"}
                {app.status === "rejected" && app.reviewNote ? (
                  <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-[11px] text-rose-800">
                    توضیح رد: {String(app.reviewNote)}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <AdminBadge
                  tone={
                    app.status === "approved"
                      ? "success"
                      : app.status === "rejected"
                        ? "danger"
                        : "warn"
                  }
                >
                  {app.status === "approved"
                    ? "تأیید"
                    : app.status === "rejected"
                      ? "رد"
                      : "در بررسی"}
                </AdminBadge>
              </td>
              <td className="px-4 py-3 space-y-2">
                <button
                  type="button"
                  className="block text-xs font-bold text-cyan-800 disabled:opacity-50"
                  disabled={busyId === String(app.id)}
                  onClick={() => sendCreditOtp(app.id ? String(app.id) : undefined)}
                >
                  {app.zohalStatus === "otp_pending"
                    ? "ارسال مجدد OTP"
                    : "استعلام اعتبار (OTP)"}
                </button>
                {app.zohalStatus === "otp_pending" ? (
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="کد OTP"
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono"
                      value={otpById[String(app.id)] || ""}
                      onChange={(e) =>
                        setOtpById((prev) => ({
                          ...prev,
                          [String(app.id)]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="text-xs font-bold text-teal-800 disabled:opacity-50"
                      disabled={busyId === String(app.id)}
                      onClick={() => verifyCreditOtp(app.id ? String(app.id) : undefined)}
                    >
                      تأیید OTP و دریافت نتیجه
                    </button>
                  </div>
                ) : null}
                <select
                  className="block w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  disabled={busyId === String(app.id)}
                  value={String(app.status || "pending")}
                  onChange={(e) =>
                    updateApplicationStatus(app.id ? String(app.id) : undefined, e.target.value)
                  }
                >
                  <option value="pending">در بررسی</option>
                  <option value="approved">تأیید وام</option>
                  <option value="rejected">رد</option>
                </select>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">اعضا و پرداخت‌ها</h2>
        <AdminTable
          headers={["نام", "طرح", "مدت عضویت", "مبلغ", "سقف اعتبار", "وضعیت پرداخت"]}
          empty="هنوز عضوی ثبت نشده است."
        >
          {members.map((m) => (
            <tr key={m.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{m.patientName}</td>
              <td className="px-4 py-3">{m.planName}</td>
              <td className="px-4 py-3">
                {m.membershipDurationLabel || m.validityLabel || "—"}
              </td>
              <td className="px-4 py-3">{(m.amount || 0).toLocaleString("fa-IR")}</td>
              <td className="px-4 py-3 text-xs">
                {m.walletCeiling != null
                  ? `${Number(m.walletCeiling).toLocaleString("fa-IR")} تومان`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <AdminBadge tone={m.status === "paid" ? "success" : "warn"}>
                  {m.status === "paid" ? "موفق" : "در انتظار"}
                </AdminBadge>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">تنظیمات طرح‌های عضویت</h2>
          <button
            type="button"
            onClick={resetPlans}
            className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
          >
            بازنشانی به پیش‌فرض
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plans.map((plan, index) => (
            <Card key={plan.id} hover={false} className="p-4">
              <h3 className="mb-3 font-bold">
                {plan.name} ({plan.id})
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-bold text-slate-500">مدت بازپرداخت وام</p>
                  <FormInput
                    value={plan.loanTermLabel || ""}
                    onChange={(e) => updatePlan(index, { loanTermLabel: e.target.value })}
                    placeholder="مثلاً ۱۵ ماهه"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold text-slate-500">سقف وام (تومان)</p>
                  <FormInput
                    type="number"
                    min={0}
                    value={plan.loanLimit ?? 0}
                    onChange={(e) =>
                      updatePlan(index, { loanLimit: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold text-slate-500">درصد پیش‌پرداخت</p>
                  <FormInput
                    type="number"
                    min={0}
                    max={100}
                    value={plan.downPaymentPercent ?? 0}
                    onChange={(e) =>
                      updatePlan(index, { downPaymentPercent: Number(e.target.value) })
                    }
                  />
                </div>
                <p className="text-xs text-slate-500">
                  حق عضویت: {plan.price} تومان — مثال پیش‌پرداخت برای ۵۰ میلیون:{" "}
                  {formatToman(Math.round(50000000 * (plan.downPaymentPercent || 0) / 100))}
                </p>
                <p className="text-xs text-slate-500">{plan.terms}</p>
              </div>
            </Card>
          ))}
        </div>
        <Button type="button" className="mt-4" onClick={savePlans}>
          ذخیره طرح‌ها
        </Button>
      </div>
    </div>
  );
}
