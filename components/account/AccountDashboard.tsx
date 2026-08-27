"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoanRequestCard } from "@/components/account/LoanRequestCard";
import { fetchPublic } from "@/lib/content/client";
import { fetchMyActivityApi, patchPatientOps } from "@/lib/operations/client";
import {
  bookingStatusLabel,
  DEFAULT_VISIT_FEE_TOMAN,
  insuranceInquiryStatusLabel,
  isPatientApproved,
  patientStatusLabel,
  payableFromFranchise,
  resolveFranchisePercent,
  shopOrderStatusLabel,
  type InsuranceCompany,
  type PatientProfile,
} from "@/lib/patient";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/utils";
import { zohalStatusLabel } from "@/lib/zohal/patient-verify";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function insuranceName(list: InsuranceCompany[], id?: string): string {
  if (!id) return "—";
  return list.find((i) => i.id === id)?.name || id;
}

function StatusBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warn" | "danger" | "info";
}) {
  const tones = {
    success: "border-teal-200 bg-teal-50 text-teal-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-cyan-200 bg-cyan-50 text-cyan-900",
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-1 text-sm font-extrabold">{value}</p>
    </div>
  );
}

function ActivityRow({
  title,
  meta,
  status,
  tone,
}: {
  title: string;
  meta: string;
  status: string;
  tone: "success" | "warn" | "danger" | "info";
}) {
  const badgeTone = {
    success: "text-teal-700",
    warn: "text-amber-700",
    danger: "text-rose-700",
    info: "text-cyan-800",
  };
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 py-3 last:border-0">
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{meta}</p>
      </div>
      <span className={`text-xs font-bold ${badgeTone[tone]}`}>{status}</span>
    </div>
  );
}

export function AccountDashboard({
  profile,
  variant,
  onEditProfile,
  message,
}: {
  profile: PatientProfile;
  variant: "web" | "app";
  onEditProfile: () => void;
  message?: string;
}) {
  const [baseList, setBaseList] = useState<InsuranceCompany[]>([]);
  const [compList, setCompList] = useState<InsuranceCompany[]>([]);
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof fetchMyActivityApi>> | null>(
    null,
  );
  const [activityError, setActivityError] = useState("");
  const [cancelBusy, setCancelBusy] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState("");

  const dentalHref = variant === "app" ? ROUTES.app.dentalGeneral : ROUTES.web.dentalGeneral;
  const consultationHref = variant === "app" ? ROUTES.app.consultation : ROUTES.web.consultation;
  const shopHref = variant === "app" ? ROUTES.app.shop : ROUTES.web.shop;
  const clubHref = variant === "app" ? ROUTES.app.club : ROUTES.web.club;
  const installmentsHref =
    variant === "app" ? ROUTES.app.installments : ROUTES.web.installments;

  useEffect(() => {
    void fetchPublic<{ base: InsuranceCompany[]; complementary: InsuranceCompany[] }>(
      "/api/content/insurances",
    )
      .then((data) => {
        setBaseList(data.base.filter((i) => i.active !== false));
        setCompList(data.complementary.filter((i) => i.active !== false));
      })
      .catch(() => {});

    void fetchMyActivityApi()
      .then(setActivity)
      .catch((e) => setActivityError(e instanceof Error ? e.message : "خطا در بارگذاری"));
  }, []);

  const franchisePercent = resolveFranchisePercent(profile);
  const lastInquiry = activity?.insuranceInquiries?.[0];
  const hasInsuranceRegistered = Boolean(
    profile.baseInsuranceId || profile.complementaryInsuranceId,
  );

  const inquiryBadge = useMemo(() => {
    if (!lastInquiry) {
      return { label: "استعلام بیمه", value: "هنوز ثبت نشده", tone: "info" as const };
    }
    const st = String(lastInquiry.status || "");
    if (st === "approved") {
      return { label: "استعلام بیمه", value: "پوشش تأیید شد", tone: "success" as const };
    }
    if (st === "rejected") {
      return { label: "استعلام بیمه", value: "رد شده", tone: "danger" as const };
    }
    return { label: "استعلام بیمه", value: "در انتظار تأیید بیمه", tone: "warn" as const };
  }, [lastInquiry]);

  const lastBooking = activity?.bookings?.[0];
  const bookingBadge = useMemo(() => {
    if (!lastBooking) {
      return { label: "آخرین نوبت", value: "رزروی ثبت نشده", tone: "info" as const };
    }
    const label = bookingStatusLabel(String(lastBooking.status || ""));
    const st = String(lastBooking.status || "");
    const tone =
      st === "confirmed" ? ("success" as const) : st === "cancelled" ? ("danger" as const) : ("warn" as const);
    return { label: "آخرین نوبت", value: label, tone };
  }, [lastBooking]);

  const shahkarTone =
    profile.zohalStatus === "passed" || profile.shahkarMatched === true
      ? "success"
      : profile.zohalStatus === "failed" || profile.shahkarMatched === false
        ? "danger"
        : "warn";

  const userTone = isPatientApproved(profile)
    ? "success"
    : profile.status === "rejected"
      ? "danger"
      : "warn";

  function reloadActivity() {
    void fetchMyActivityApi()
      .then(setActivity)
      .catch((e) => setActivityError(e instanceof Error ? e.message : "خطا در بارگذاری"));
  }

  function cancelBooking(id: string) {
    if (
      !window.confirm(
        "آیا از لغو این نوبت مطمئن هستید؟\n\nبیعانه پرداخت‌شده قابل استرداد نیست.",
      )
    ) {
      return;
    }
    setCancelBusy(id);
    setCancelMessage("");
    void patchPatientOps<{ message?: string }>(`/api/operations/bookings/${encodeURIComponent(id)}`, {
      status: "cancelled",
    })
      .then((res) => {
        setCancelMessage(res.message || "رزرو لغو شد.");
        reloadActivity();
      })
      .catch((e) => setCancelMessage(e instanceof Error ? e.message : "لغو ناموفق"))
      .finally(() => setCancelBusy(null));
  }

  return (
    <div className="space-y-6">
      <Card hover={false} className="border-teal-200 bg-teal-50/50 p-4 text-sm text-teal-900">
        سلام {profile.name.split(/\s+/)[0] || "بیمار"} — پنل شما فعال است. برای رزرو دیگر نیازی به
        وارد کردن دوباره نام و موبایل نیست.
      </Card>

      <LoanRequestCard
        phone={profile.phone}
        name={profile.name}
        nationalId={profile.nationalId}
        variant={variant}
      />

      <p className="text-xs leading-6 text-slate-500">
        توجه: <strong>تأیید نوبت</strong> در ادمین رزروها جدا از <strong>تأیید استعلام بیمه</strong> است.
        وضعیت نوبت و بیمه را در کارت‌های زیر جدا ببینید.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatusBadge
          label="کاربری"
          value={patientStatusLabel(profile.status)}
          tone={userTone}
        />
        <StatusBadge
          label="کد ملی (شاهکار)"
          value={zohalStatusLabel(profile.zohalStatus, profile.shahkarMatched)}
          tone={shahkarTone}
        />
        <StatusBadge
          label="بیمه ثبت‌شده"
          value={
            hasInsuranceRegistered
              ? `${insuranceName(compList, profile.complementaryInsuranceId) !== "—" ? insuranceName(compList, profile.complementaryInsuranceId) : insuranceName(baseList, profile.baseInsuranceId)} · ${franchisePercent}٪`
              : "ثبت نشده"
          }
          tone={hasInsuranceRegistered ? "info" : "warn"}
        />
        <StatusBadge label={bookingBadge.label} value={bookingBadge.value} tone={bookingBadge.tone} />
        <StatusBadge label={inquiryBadge.label} value={inquiryBadge.value} tone={inquiryBadge.tone} />
      </div>

      <Card hover={false} className="p-4">
        <p className="mb-3 text-sm font-extrabold text-slate-900">دسترسی سریع</p>
        <div className="flex flex-wrap gap-2">
          <Link href={dentalHref}>
            <Button type="button" className="text-sm">
              رزرو نوبت
            </Button>
          </Link>
          <Link href={consultationHref}>
            <Button type="button" variant="outline" className="text-sm">
              مشاوره
            </Button>
          </Link>
          <Link href={shopHref}>
            <Button type="button" variant="outline" className="text-sm">
              فروشگاه
            </Button>
          </Link>
          <Link href={clubHref}>
            <Button type="button" variant="outline" className="text-sm">
              باشگاه
            </Button>
          </Link>
          <Link href={installmentsHref}>
            <Button type="button" variant="outline" className="text-sm">
              اقساط
            </Button>
          </Link>
        </div>
      </Card>

      <Card hover={false} className="p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-extrabold text-slate-900">مشخصات ثبت‌شده</p>
          <Button type="button" variant="outline" className="text-xs" onClick={onEditProfile}>
            ویرایش مشخصات
          </Button>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-slate-500">نام:</span>{" "}
            <span className="font-bold">{profile.name}</span>
          </p>
          <p>
            <span className="text-slate-500">موبایل:</span>{" "}
            <span className="font-bold font-mono text-xs">{profile.phone}</span>
          </p>
          <p>
            <span className="text-slate-500">کد ملی:</span>{" "}
            <span className="font-bold font-mono text-xs">{profile.nationalId || "—"}</span>
          </p>
          <p>
            <span className="text-slate-500">فرانشیز:</span>{" "}
            <span className="font-bold">{franchisePercent}٪</span>
          </p>
        </div>
        <p className="mt-3 text-xs leading-6 text-slate-500">
          نمونه ویزیت {formatPrice(DEFAULT_VISIT_FEE_TOMAN)} با فرانشیز {franchisePercent}٪ →{" "}
          <strong className="text-teal-800">
            {formatPrice(payableFromFranchise(DEFAULT_VISIT_FEE_TOMAN, franchisePercent))}
          </strong>
          . «تأیید استعلام رزرو» جدا از پروفایل است و در مرحله پرداخت رزرو انجام می‌شود.
        </p>
      </Card>

      {message ? <p className="text-sm font-bold text-cyan-800">{message}</p> : null}
      {cancelMessage ? (
        <p className="text-sm font-bold text-teal-800">{cancelMessage}</p>
      ) : null}

      {activityError ? (
        <p className="text-sm text-rose-600">{activityError}</p>
      ) : !activity ? (
        <p className="text-sm text-slate-500">در حال بارگذاری فعالیت‌ها…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card hover={false} className="p-4">
            <p className="mb-2 text-sm font-extrabold text-slate-900">رزروهای اخیر</p>
            {activity.bookings.length === 0 ? (
              <p className="text-xs text-slate-500">هنوز رزروی ثبت نشده است.</p>
            ) : (
              activity.bookings.map((b) => {
                const st = String(b.status || "");
                const tone =
                  st === "confirmed" ? "success" : st === "cancelled" ? "danger" : "warn";
                const bookingId = String(b.id);
                return (
                  <div
                    key={bookingId}
                    className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 py-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {String(b.doctorName || "رزرو دندانپزشکی")}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {String(b.dateLabel || b.day || "—")} {String(b.timeLabel || "")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs font-bold ${
                          tone === "success"
                            ? "text-teal-700"
                            : tone === "danger"
                              ? "text-rose-700"
                              : "text-amber-700"
                        }`}
                      >
                        {bookingStatusLabel(st)}
                      </span>
                      {st !== "cancelled" ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-xs text-rose-700"
                          disabled={cancelBusy === bookingId}
                          onClick={() => cancelBooking(bookingId)}
                        >
                          {cancelBusy === bookingId ? "در حال لغو…" : "لغو نوبت"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </Card>

          <Card hover={false} className="p-4">
            <p className="mb-2 text-sm font-extrabold text-slate-900">استعلام‌های بیمه (رزرو)</p>
            {activity.insuranceInquiries.length === 0 ? (
              <p className="text-xs text-slate-500">
                استعلامی ثبت نشده. در صفحه تأیید رزرو (`/dental/confirm`) درخواست دهید.
              </p>
            ) : (
              activity.insuranceInquiries.map((q) => {
                const st = String(q.status || "");
                const tone =
                  st === "approved" ? "success" : st === "rejected" ? "danger" : "warn";
                const visitFee = Number(q.visitFee) || DEFAULT_VISIT_FEE_TOMAN;
                const pct = Number(q.franchisePercent) || franchisePercent;
                return (
                  <ActivityRow
                    key={String(q.id)}
                    title={`استعلام · ${String(q.mode || "—")}`}
                    meta={`${new Date(String(q.createdAt)).toLocaleDateString("fa-IR")} · فرانشیز ${pct}٪ → ${formatPrice(payableFromFranchise(visitFee, pct))}`}
                    status={insuranceInquiryStatusLabel(st)}
                    tone={tone}
                  />
                );
              })
            )}
          </Card>

          <Card hover={false} className="p-4 lg:col-span-2">
            <p className="mb-2 text-sm font-extrabold text-slate-900">مشاوره‌های اخیر</p>
            {activity.consultations.length === 0 ? (
              <p className="text-xs text-slate-500">درخواست مشاوره‌ای ثبت نشده است.</p>
            ) : (
              <div className="grid gap-0 sm:grid-cols-2">
                {activity.consultations.map((c) => {
                  const st = String(c.status || "");
                  const tone = st === "answered" ? "success" : "warn";
                  const preferred =
                    c.preferredDateLabel || c.preferredTimeLabel
                      ? ` · ${String(c.preferredDateLabel || "")} ${String(c.preferredTimeLabel || "")}`.trim()
                      : "";
                  return (
                    <ActivityRow
                      key={String(c.id)}
                      title={String(c.typeLabel || c.categoryLabel || "مشاوره")}
                      meta={`${String(c.doctorName || c.specialtyLabel || "—")}${preferred} · ${new Date(String(c.createdAt)).toLocaleDateString("fa-IR")}`}
                      status={st === "answered" ? "پاسخ داده شد" : "در انتظار"}
                      tone={tone}
                    />
                  );
                })}
              </div>
            )}
          </Card>

          <Card hover={false} className="p-4 lg:col-span-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-slate-900">سفارشات فروشگاه</p>
              <Link href={shopHref} className="text-xs font-bold text-teal-700 hover:underline">
                ادامه خرید
              </Link>
            </div>
            {(activity.shopOrders || []).length === 0 ? (
              <p className="text-xs text-slate-500">هنوز سفارشی از فروشگاه ثبت نشده است.</p>
            ) : (
              <div className="grid gap-0 sm:grid-cols-2">
                {(activity.shopOrders || []).map((order) => {
                  const st = String(order.status || "");
                  const tone =
                    st === "shipped" || st === "confirmed"
                      ? "success"
                      : st === "cancelled"
                        ? "danger"
                        : "warn";
                  const items = Array.isArray(order.items) ? order.items : [];
                  const itemNames = items
                    .slice(0, 2)
                    .map((item) => {
                      const row = item as Record<string, unknown>;
                      return String(row.name || "محصول");
                    })
                    .join("، ");
                  const more = items.length > 2 ? ` و ${items.length - 2} مورد دیگر` : "";
                  return (
                    <ActivityRow
                      key={String(order.id)}
                      title={`${itemNames || "سفارش فروشگاه"}${more}`}
                      meta={`${formatPrice(Number(order.total || 0))} · ${new Date(String(order.createdAt)).toLocaleDateString("fa-IR")} · ${String(order.id)}`}
                      status={shopOrderStatusLabel(st)}
                      tone={tone}
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
