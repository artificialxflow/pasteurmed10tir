"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import {
  deleteAdminCommerce,
  fetchAdminCommerce,
  patchAdminCommerce,
  postAdminCommerce,
  putAdminCommerce,
} from "@/lib/commerce/client";
import { ROUTES } from "@/lib/routes";
import { confirmAction } from "@/lib/ui/confirm-action";
import { type Membership } from "@/lib/data";
import { formatToman } from "@/lib/membership";
import { formatJalaliDate } from "@/lib/patient";
import { type Member } from "@/lib/storage";
import {
  formatZohalCheckedAt,
  ZOHAL_CREDIT_DISABLED,
  zohalCreditCheckNotice,
  zohalCreditStatusLabel,
  zohalCreditStatusTone,
} from "@/lib/zohal/run-credit-check";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  zohalCheckedAt?: string;
  zohalShahkarMatched?: boolean | null;
  reviewNote?: string | null;
  documents?: { id?: string; kind?: string; filename?: string }[];
  requiredDocumentsReady?: number;
  requiredDocumentsTotal?: number;
};

type MemberRow = Member & { walletCeiling?: number | null };

type MembersSummary = {
  count: number;
  paidCount: number;
  totalAmount: number;
  paidAmount: number;
};

export default function AdminMembershipsPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [summary, setSummary] = useState<MembersSummary>({
    count: 0,
    paidCount: 0,
    totalAmount: 0,
    paidAmount: 0,
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [plans, setPlans] = useState<Membership[]>([]);
  const [memberStatus, setMemberStatus] = useState("paid");
  const [memberFrom, setMemberFrom] = useState("");
  const [memberTo, setMemberTo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [otpById, setOtpById] = useState<Record<string, string>>({});

  const reloadMembers = useCallback(async () => {
    const params = new URLSearchParams();
    if (memberStatus && memberStatus !== "all") params.set("status", memberStatus);
    if (memberFrom) params.set("from", memberFrom);
    if (memberTo) params.set("to", memberTo);
    const qs = params.toString();
    const membersData = await fetchAdminCommerce<{
      members: MemberRow[];
      summary?: MembersSummary;
      applications: Application[];
    }>(`/api/admin/commerce/members${qs ? `?${qs}` : ""}`);
    setMembers(membersData.members);
    setApplications(membersData.applications);
    setSummary(
      membersData.summary || {
        count: membersData.members.length,
        paidCount: membersData.members.filter((m) => m.status === "paid").length,
        totalAmount: membersData.members.reduce((s, m) => s + Number(m.amount || 0), 0),
        paidAmount: membersData.members
          .filter((m) => m.status === "paid")
          .reduce((s, m) => s + Number(m.amount || 0), 0),
      },
    );
  }, [memberStatus, memberFrom, memberTo]);

  async function reload() {
    try {
      const [plansData] = await Promise.all([
        fetchAdminCommerce<{ items: Membership[] }>("/api/admin/commerce/membership-plans"),
        reloadMembers(),
      ]);
      setPlans(plansData.items.map((p) => ({ ...p, features: [...p.features] })));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری");
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load
  }, []);

  useEffect(() => {
    void reloadMembers().catch((e) =>
      setError(e instanceof Error ? e.message : "خطا در بارگذاری اعضا"),
    );
  }, [reloadMembers]);

  const memberReportHint = useMemo(() => {
    if (!memberFrom && !memberTo) return "همه تاریخ‌ها";
    return `${memberFrom ? formatJalaliDate(memberFrom) : "…"} تا ${memberTo ? formatJalaliDate(memberTo) : "…"}`;
  }, [memberFrom, memberTo]);

  function updatePlan(index: number, patch: Partial<Membership>) {
    setPlans((prev) =>
      prev.map((plan, i) => (i === index ? { ...plan, ...patch } : plan)),
    );
  }

  function savePlans() {
    const cleaned = plans.map((plan) => {
      const priceNum = Math.max(0, Math.round(Number(plan.priceNum || 0)));
      return {
        ...plan,
        priceNum,
        price: priceNum.toLocaleString("fa-IR"),
        loanLimit: Number(plan.loanLimit || 0),
        downPaymentPercent: Number(plan.downPaymentPercent || 0),
        loanTermLabel: String(plan.loanTermLabel || "").trim(),
        terms: String(plan.terms || "").trim(),
      };
    });
    void putAdminCommerce<{ items: Membership[] }>("/api/admin/commerce/membership-plans", {
      items: cleaned,
    })
      .then((data) => setPlans(data.items.map((p) => ({ ...p, features: [...p.features] }))))
      .catch((e: Error) => setError(e.message));
  }

  function resetPlans() {
    if (!confirmAction("طرح‌های عضویت به پیش‌فرض بازنشانی شود؟")) return;
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
    } else if (
      status === "partial" ||
      status === "otp_pending" ||
      status === ZOHAL_CREDIT_DISABLED
    ) {
      // «سرویس غیرفعال» خطای ما نیست — هشدار زرد، نه خطای قرمز
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

  function deleteApplication(app: Application) {
    const id = app.id ? String(app.id) : "";
    if (!id || busyId) return;
    const name = String(app.patientName || app.phone || id);
    if (
      !window.confirm(
        `درخواست وام «${name}» حذف شود؟\n\nطرح اقساط مرتبط با این درخواست هم از لیست اقساط ناپدید می‌شود. سابقه در دیتابیس می‌ماند.`,
      )
    ) {
      return;
    }
    setBusyId(id);
    setError("");
    setSuccess("");
    void deleteAdminCommerce<{ message?: string }>(
      `/api/admin/commerce/membership-applications/${encodeURIComponent(id)}`,
    )
      .then((res) => {
        setSuccess(res.message || "درخواست وام حذف شد.");
        return reload();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusyId(null));
  }

  function updateApplicationStatus(id: string | undefined, status: string) {
    if (!id || busyId) return;
    if (!confirmAction("وضعیت این درخواست وام تغییر کند؟")) return;
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
        <p className="mb-3 text-sm text-slate-600">
          این بخش فقط درخواست‌های وام/پیشنهاد است؛ لیست کسانی که حق عضویت پرداخت کرده‌اند پایین‌تر در
          «گزارش اعضا» آمده است.
        </p>
        <AdminTable
          headers={[
            "مشتری",
            "کد ملی",
            "مبلغ وام",
            "طرح",
            "زحل",
            "خلاصه",
            "وضعیت",
            "مدارک",
            "عملیات",
          ]}
          empty="فرم عضویتی ثبت نشده است."
        >
          {applications.map((app) => {
            const tone = zohalCreditStatusTone(app.zohalStatus);
            const creditDisabled = app.zohalStatus === ZOHAL_CREDIT_DISABLED;
            return (
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
                    tone === "warn"
                      ? "text-amber-700"
                      : tone === "danger"
                        ? "text-rose-700"
                        : tone === "ok"
                          ? "text-teal-700"
                          : ""
                  }
                >
                  {zohalLabel(app)}
                </span>
              </td>
              <td className="max-w-xs px-4 py-3 text-xs leading-5 whitespace-pre-line text-slate-600">
                {app.zohalSummary || "—"}
                {app.zohalCheckedAt ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    آخرین استعلام: {formatZohalCheckedAt(app.zohalCheckedAt)}
                  </p>
                ) : null}
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
              <td className="px-4 py-3 text-xs">
                {app.loanAmount
                  ? `${Number(app.requiredDocumentsReady || 0).toLocaleString("fa-IR")} از ${Number(app.requiredDocumentsTotal || 4).toLocaleString("fa-IR")} الزامی`
                  : "—"}
                {(app.documents || []).map((doc) => (
                  <a
                    key={String(doc.id)}
                    href={`/api/documents/${encodeURIComponent(String(doc.id))}?download=1`}
                    className="mt-1 block font-bold text-teal-700 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doc.filename || doc.kind}
                  </a>
                ))}
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
                {creditDisabled ? (
                  <p className="text-[11px] leading-4 text-amber-800">
                    سرویس در پنل زحل فعال نیست. تلاش مجدد تا فعال‌سازی بی‌فایده است.
                    وام را از همین‌جا می‌توانید دستی تأیید کنید.
                  </p>
                ) : null}
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
                <button
                  type="button"
                  className="block text-xs font-bold text-rose-700 disabled:opacity-50"
                  disabled={busyId === String(app.id)}
                  onClick={() => deleteApplication(app)}
                >
                  حذف وام
                </button>
              </td>
            </tr>
            );
          })}
        </AdminTable>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-bold">گزارش اعضا (پرداخت حق عضویت)</h2>
        <p className="mb-4 text-sm leading-7 text-slate-600">
          کسانی که عضویت‌شان ثبت شده — موبایل، تاریخ عضویت/واریز (شمسی از زمان ثبت پرداخت)، مبلغ و
          وضعیت. بازه فعلی: {memberReportHint}.
        </p>

        <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FormLabel>وضعیت</FormLabel>
            <FormSelect value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)}>
              <option value="paid">پرداخت‌شده</option>
              <option value="pending">در انتظار</option>
              <option value="all">همه</option>
            </FormSelect>
          </div>
          <JalaliBirthDateField
            label="از تاریخ عضویت (شمسی)"
            value={memberFrom}
            onChange={setMemberFrom}
          />
          <JalaliBirthDateField
            label="تا تاریخ عضویت (شمسی)"
            value={memberTo}
            onChange={setMemberTo}
          />
          <Card hover={false} className="space-y-1 p-4">
            <p className="text-2xl font-bold text-teal-700">
              {summary.paidCount.toLocaleString("fa-IR")} نفر
            </p>
            <p className="text-sm text-slate-500">
              جمع مبلغ پرداخت‌شده: {summary.paidAmount.toLocaleString("fa-IR")} تومان
            </p>
            <p className="text-xs text-slate-400">
              در فیلتر فعلی: {summary.count.toLocaleString("fa-IR")} ردیف
            </p>
            {(memberFrom || memberTo) && (
              <button
                type="button"
                className="text-xs font-bold text-teal-800 underline"
                onClick={() => {
                  setMemberFrom("");
                  setMemberTo("");
                }}
              >
                پاک کردن بازه
              </button>
            )}
          </Card>
        </div>

        <AdminTable
          headers={[
            "نام",
            "موبایل",
            "طرح",
            "مدت عضویت",
            "مبلغ",
            "سقف اعتبار",
            "تاریخ عضویت / واریز",
            "وضعیت پرداخت",
          ]}
          empty="با این فیلتر عضوی نیست."
        >
          {members.map((m) => (
            <tr key={m.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{m.patientName || "—"}</td>
              <td className="px-4 py-3 font-mono text-xs">{m.patientPhone || "—"}</td>
              <td className="px-4 py-3">{m.planName || "—"}</td>
              <td className="px-4 py-3">
                {m.membershipDurationLabel || m.validityLabel || "—"}
              </td>
              <td className="px-4 py-3">{(m.amount || 0).toLocaleString("fa-IR")}</td>
              <td className="px-4 py-3 text-xs">
                {m.walletCeiling != null
                  ? `${Number(m.walletCeiling).toLocaleString("fa-IR")} تومان`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-xs">{formatJalaliDate(m.createdAt)}</td>
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
                  <p className="mb-1 text-xs font-bold text-slate-500">حق عضویت (تومان)</p>
                  <FormInput
                    type="number"
                    min={0}
                    value={plan.priceNum ?? 0}
                    onChange={(e) => {
                      const priceNum = Number(e.target.value);
                      updatePlan(index, {
                        priceNum,
                        price: priceNum.toLocaleString("fa-IR"),
                      });
                    }}
                  />
                </div>
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
                <div>
                  <p className="mb-1 text-xs font-bold text-slate-500">توضیح طرح</p>
                  <FormTextarea
                    rows={3}
                    value={plan.terms || ""}
                    onChange={(e) => updatePlan(index, { terms: e.target.value })}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  حق عضویت نمایش: {plan.price} تومان — مثال پیش‌پرداخت برای ۵۰ میلیون:{" "}
                  {formatToman(Math.round(50000000 * (plan.downPaymentPercent || 0) / 100))}
                </p>
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
