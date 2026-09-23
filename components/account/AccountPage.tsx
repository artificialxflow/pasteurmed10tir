"use client";

import { AccountDashboard } from "@/components/account/AccountDashboard";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { notifyPatientAuthChanged } from "@/lib/auth/use-patient-profile";
import { fetchPublic } from "@/lib/content/client";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import {
  clampFranchisePercent,
  DEFAULT_FRANCHISE_PERCENT,
  DEFAULT_VISIT_FEE_TOMAN,
  isPatientApproved,
  patientStatusLabel,
  payableFromFranchise,
  type InsuranceCompany,
  type PatientProfile,
} from "@/lib/patient";
import { WEB_PAGE_CONTAINER } from "@/lib/layout";
import { formatPrice, normalizePhone } from "@/lib/utils";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

export function AccountPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [baseId, setBaseId] = useState("");
  const [compId, setCompId] = useState("");
  const [franchise, setFranchise] = useState(String(DEFAULT_FRANCHISE_PERCENT));
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMode, setOtpMode] = useState<"sms" | "dev" | "">("");
  const [messageKind, setMessageKind] = useState<"error" | "success">("success");
  const [resendIn, setResendIn] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [loginKind, setLoginKind] = useState<"person" | "organization">("person");
  const [organizationName, setOrganizationName] = useState("");
  const [baseList, setBaseList] = useState<InsuranceCompany[]>([]);
  const [compList, setCompList] = useState<InsuranceCompany[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const hydrate = useCallback((p: PatientProfile) => {
    setProfile(p);
    setPhone(p.phone);
    setName(p.name);
    setNationalId(p.nationalId || "");
    setBaseId(p.baseInsuranceId || "");
    setCompId(p.complementaryInsuranceId || "");
    setFranchise(String(p.franchisePercent ?? DEFAULT_FRANCHISE_PERCENT));
    if (p.status === "approved") setEditing(false);
  }, []);

  useEffect(() => {
    PasteurStorage.hideMembershipInstallmentPlans();

    fetchPublic<{ base: InsuranceCompany[]; complementary: InsuranceCompany[] }>(
      "/api/content/insurances",
    )
      .then((data) => {
        setBaseList(data.base.filter((i) => i.active !== false));
        setCompList(data.complementary.filter((i) => i.active !== false));
      })
      .catch(() => {});

    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { profile?: PatientProfile };
        return data.profile ?? null;
      })
      .then((p) => {
        if (p) hydrate(p);
      })
      .finally(() => setReady(true));
  }, [hydrate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  async function sendOtp() {
    const digits = normalizePhone(phone);
    if (digits.length < 10) {
      setMessageKind("error");
      setMessage("موبایل معتبر وارد کنید.");
      return;
    }
    setSendingOtp(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        mode?: "sms" | "dev";
        registered?: boolean;
        hasOrganization?: boolean;
      };
      if (!res.ok) {
        setMessageKind("error");
        setMessage(data.error || "ارسال کد ناموفق بود.");
        setOtpSent(false);
        return;
      }
      setOtpSent(true);
      setOtpMode(data.mode === "dev" ? "dev" : "sms");
      setRegistered(Boolean(data.registered));
      setHasOrganization(Boolean(data.hasOrganization));
      setResendIn(60);
      setMessageKind("success");
      if (data.mode === "dev") {
        setMessage(data.message || "برای این شماره پیامک نمی‌آید. کد تست را وارد کنید.");
      } else if (data.registered) {
        setMessage("کد تأیید پیامک شد. همان کد را وارد کنید و وارد شوید.");
      } else {
        setMessage(data.message || "کد ارسال شد. برای ثبت‌نام نام را هم وارد کنید.");
      }
    } catch {
      setMessageKind("error");
      setMessage("خطا در ارتباط با سرور.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    if (!otpSent) {
      await sendOtp();
      return;
    }
    const digits = normalizePhone(phone);
    if (digits.length < 10 || !otpCode.trim()) {
      setMessageKind("error");
      setMessage("موبایل و کد تأیید را وارد کنید.");
      return;
    }
    if (!registered && !name.trim()) {
      setMessageKind("error");
      setMessage(
        loginKind === "organization"
          ? "نام نماینده سازمان را وارد کنید."
          : "برای ثبت‌نام، نام و نام خانوادگی را وارد کنید.",
      );
      return;
    }
    if (loginKind === "organization" && !hasOrganization && !organizationName.trim()) {
      setMessageKind("error");
      setMessage("نام سازمان را وارد کنید.");
      return;
    }
    setMessage("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digits,
          code: otpCode.trim(),
          loginKind,
          ...(registered ? {} : { name: name.trim() }),
          ...(loginKind === "organization" && !hasOrganization
            ? { organizationName: organizationName.trim() }
            : {}),
        }),
      });
      const data = (await res.json()) as { profile?: PatientProfile; error?: string };
      if (!res.ok || !data.profile) {
        setMessageKind("error");
        setMessage(data.error || "ورود ناموفق بود.");
        return;
      }
      hydrate(data.profile);
      notifyPatientAuthChanged();
      if (data.profile.status !== "approved") setEditing(true);
      setMessageKind("success");
      setMessage(
        data.profile.status === "approved"
          ? "وارد شدید. پروفایل شما فعال است."
          : "وارد شدید. حساب در سامانه ثبت شد — کارشناس در «تأیید کاربری» ادمین بررسی می‌کند.",
      );
    } catch {
      setMessageKind("error");
      setMessage("خطا در ارتباط با سرور.");
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const nid = nationalId.trim();
    if (!nid) {
      setMessage("کد ملی الزامی است.");
      return;
    }
    const percent = clampFranchisePercent(Number(franchise));
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          nationalId: nid,
          baseInsuranceId: baseId || undefined,
          complementaryInsuranceId: compId || undefined,
          franchisePercent: percent,
        }),
      });
      const data = (await res.json()) as { profile?: PatientProfile; error?: string };
      if (!res.ok || !data.profile) {
        setMessage(data.error || "ذخیره ناموفق بود.");
        return;
      }
      hydrate(data.profile);
      notifyPatientAuthChanged();
      if (data.profile.status === "approved") {
        setEditing(false);
        setMessage(
          data.profile.zohalStatus === "passed"
            ? "پروفایل ذخیره شد. استعلام شاهکار موفق — حساب شما تأیید شد."
            : "پروفایل ذخیره شد و تأیید شد.",
        );
      } else if (data.profile.status === "rejected") {
        setEditing(true);
        setMessage(
          data.profile.zohalStatus === "failed"
            ? "کد ملی با موبایل شما تطبیق ندارد. کد ملی را اصلاح کنید و دوباره ذخیره کنید."
            : data.profile.reviewNote || "درخواست رد شد. مشخصات را اصلاح کنید.",
        );
      } else if (data.profile.zohalStatus === "error") {
        setEditing(true);
        setMessage(
          "پروفایل ذخیره شد. خطا در استعلام زحل — کارشناس به‌صورت دستی بررسی می‌کند.",
        );
      } else {
        setEditing(true);
        setMessage(
          data.profile.zohalStatus === "skipped"
            ? "پروفایل ذخیره شد و برای بررسی کارشناس در صف قرار گرفت."
            : "پروفایل ذخیره شد. در حال بررسی…",
        );
      }
    } catch {
      setMessage("خطا در ارتباط با سرور.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setProfile(null);
    setOtpCode("");
    setOtpSent(false);
    setOtpMode("");
    notifyPatientAuthChanged();
    setMessageKind("success");
    setMessage("خارج شدید.");
  }

  if (!ready) {
    return <p className="py-10 text-center text-sm text-slate-500">در حال بارگذاری...</p>;
  }

  const helpHref = variant === "app" ? ROUTES.app.help : ROUTES.web.help;
  const complaintsHref = variant === "app" ? ROUTES.app.complaints : ROUTES.web.complaints;
  const supportHref = variant === "app" ? ROUTES.app.support : ROUTES.web.support;
  const installmentsHref =
    variant === "app" ? ROUTES.app.installments : ROUTES.web.installments;

  if (!profile) {
    return (
      <div className={variant === "app" ? "space-y-4" : WEB_PAGE_CONTAINER}>
        <h1 className="mb-2 text-xl font-extrabold text-slate-900">ورود / ثبت‌نام</h1>
        <p className="mb-6 text-sm text-slate-600">
          ورود اشخاص یا ورود سازمان — نماینده سازمان با همان موبایل کد تأیید می‌گیرد.
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-xl border px-3 py-2 text-sm font-extrabold ${
              loginKind === "person"
                ? "border-cyan-700 bg-cyan-800 text-white"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setLoginKind("person")}
          >
            ورود اشخاص
          </button>
          <button
            type="button"
            className={`rounded-xl border px-3 py-2 text-sm font-extrabold ${
              loginKind === "organization"
                ? "border-cyan-700 bg-cyan-800 text-white"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setLoginKind("organization")}
          >
            ورود سازمان
          </button>
        </div>
        <Card hover={false} className="mb-4 border-cyan-100 bg-cyan-50/60 p-4 text-xs leading-6 text-slate-600">
          <p className="font-bold text-slate-800">مراحل</p>
          <ol className="mt-2 list-decimal space-y-1 pr-4">
            <li>موبایل را وارد کنید و «ارسال کد تأیید» بزنید</li>
            <li>کد پیامک‌شده را وارد کنید (پیامک معمولاً چند ثانیه طول می‌کشد)</li>
            <li>اگر اولین ورود است، نام و نام خانوادگی را بنویسید و وارد شوید</li>
          </ol>
        </Card>
        <Card hover={false} className="space-y-3 p-5">
          <form onSubmit={login} className="space-y-3">
            <div>
              <FormLabel>موبایل</FormLabel>
              <FormInput
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="0912xxxxxxx"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setRegistered(false);
                  setOtpSent(false);
                  setOtpMode("");
                  setOtpCode("");
                }}
                required
              />
            </div>
            {!otpSent ? (
              <Button
                type="button"
                className="w-full"
                disabled={sendingOtp}
                onClick={sendOtp}
              >
                {sendingOtp ? "در حال ارسال…" : "ارسال کد تأیید"}
              </Button>
            ) : (
              <>
                {otpSent && !registered ? (
                  <div>
                    <FormLabel>
                      {loginKind === "organization" ? "نام نماینده سازمان" : "نام و نام خانوادگی (ثبت‌نام جدید)"}
                    </FormLabel>
                    <FormInput
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                ) : null}
                {otpSent && loginKind === "organization" && !hasOrganization ? (
                  <div>
                    <FormLabel>نام سازمان</FormLabel>
                    <FormInput
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="مثلاً شرکت ماشین‌سازی تبریز"
                      required
                    />
                  </div>
                ) : null}
                <div>
                  <FormLabel>کد تأیید</FormLabel>
                  <FormInput
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="کد ۵ رقمی پیامک"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
                {otpMode === "dev" ? (
                  <p className="text-xs font-bold text-amber-800">
                    این شماره تست است؛ پیامک نمی‌آید. کد تست را وارد کنید.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    اگر پیامک نیامد، پوشه اسپم پیامک را چک کنید یا پس از یک دقیقه دوباره ارسال کنید.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm"
                  disabled={sendingOtp || resendIn > 0}
                  onClick={sendOtp}
                >
                  {sendingOtp
                    ? "در حال ارسال…"
                    : resendIn > 0
                      ? `ارسال مجدد تا ${resendIn} ثانیه`
                      : "ارسال مجدد کد"}
                </Button>
                <Button type="submit" className="w-full">
                  {registered ? "ورود به پنل کاربری" : "ثبت‌نام و ورود"}
                </Button>
              </>
            )}
            {message ? (
              <p
                className={`text-sm font-bold ${
                  messageKind === "error" ? "text-red-700" : "text-teal-800"
                }`}
              >
                {message}
              </p>
            ) : null}
          </form>
        </Card>
      </div>
    );
  }

  const samplePayable = payableFromFranchise(
    DEFAULT_VISIT_FEE_TOMAN,
    clampFranchisePercent(Number(franchise)),
  );
  const approved = isPatientApproved(profile);
  const showDashboard = approved && !editing;

  return (
    <div className={variant === "app" ? "space-y-4" : `${WEB_PAGE_CONTAINER} space-y-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            {showDashboard ? "پنل من" : editing && approved ? "ویرایش مشخصات" : "پنل کاربری"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{profile.phone}</p>
          <p
            className={`mt-2 text-sm font-bold ${
              approved ? "text-teal-700" : "text-amber-700"
            }`}
          >
            وضعیت کاربری: {patientStatusLabel(profile.status)}
          </p>
        </div>
        <Button type="button" variant="outline" className="text-sm" onClick={logout}>
          خروج
        </Button>
      </div>

      {!approved ? (
        <Card hover={false} className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {profile.status === "rejected" ? (
            <>
              درخواست قبلی رد شده است. مشخصات را اصلاح کنید و دوباره ذخیره کنید تا کارشناس
              بررسی کند.
              {profile.zohalStatus === "failed" ? (
                <p className="mt-2 font-bold">
                  علت: کد ملی با شماره موبایل {profile.phone} در سامانه شاهکار تطبیق ندارد.
                </p>
              ) : null}
              {profile.reviewNote ? (
                <p className="mt-2 font-bold">یادداشت کارشناس: {profile.reviewNote}</p>
              ) : null}
            </>
          ) : (
            <>
              حساب شما ثبت شده است.
              {profile.zohalStatus === "error" ? (
                <> خطا در استعلام خودکار — کارشناس به‌صورت دستی بررسی می‌کند.</>
              ) : profile.zohalStatus === "skipped" ? (
                <> در لیست «تأیید کاربری» ادمین قرار دارد.</>
              ) : (
                <> استعلام شاهکار در حال انجام یا بررسی است.</>
              )}
            </>
          )}
        </Card>
      ) : showDashboard ? null : (
        <Card hover={false} className="border-cyan-100 bg-cyan-50/60 p-4 text-sm text-slate-700">
          در حال ویرایش مشخصات. اگر بیمه یا فرانشیز را تغییر دهید، حساب دوباره برای بررسی کارشناس
          در صف قرار می‌گیرد.
        </Card>
      )}

      {showDashboard ? (
        <AccountDashboard
          profile={profile}
          variant={variant}
          message={message}
          onEditProfile={() => {
            setEditing(true);
            setMessage("");
          }}
        />
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href={installmentsHref}
              className="rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm font-extrabold text-teal-900 transition hover:border-teal-400"
            >
              اقساط من
              <span className="mt-0.5 block text-xs font-normal text-teal-800/80">
                صورتحساب و پرداخت قسط
              </span>
            </Link>
            <Link
              href={supportHref}
              className="rounded-xl border border-cyan-200 bg-cyan-50/80 px-4 py-3 text-sm font-extrabold text-cyan-900 transition hover:border-cyan-400"
            >
              پشتیبانی / تیکت
              <span className="mt-0.5 block text-xs font-normal text-cyan-800/80">
                ثبت درخواست و پیگیری پاسخ
              </span>
            </Link>
            <Link
              href={helpHref}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-300"
            >
              آموزش سامانه
            </Link>
            <Link
              href={complaintsHref}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-300"
            >
              ثبت شکایت
            </Link>
          </div>

          <Card hover={false} className="p-5">
            <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormLabel>نام</FormLabel>
                <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <FormLabel>کد ملی</FormLabel>
                <FormInput
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  required
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="۱۰ رقم"
                />
              </div>
              <div>
                <FormLabel>فرانشیز (درصد)</FormLabel>
                <FormInput
                  type="number"
                  min={0}
                  max={100}
                  value={franchise}
                  onChange={(e) => setFranchise(e.target.value)}
                />
              </div>
              <div>
                <FormLabel>بیمه پایه</FormLabel>
                <FormSelect value={baseId} onChange={(e) => setBaseId(e.target.value)}>
                  <option value="">— انتخاب کنید —</option>
                  {baseList.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <FormLabel>بیمه تکمیلی</FormLabel>
                <FormSelect value={compId} onChange={(e) => setCompId(e.target.value)}>
                  <option value="">— انتخاب کنید —</option>
                  {compList.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-3 text-xs leading-6 text-slate-500">
                  پس از تأیید کارشناس، فقط همین درصد از هزینه ویزیت پرداخت می‌شود. مثال: ویزیت{" "}
                  {formatPrice(DEFAULT_VISIT_FEE_TOMAN)} با فرانشیز{" "}
                  {clampFranchisePercent(Number(franchise))}٪ → مبلغ واریزی{" "}
                  {formatPrice(samplePayable)}.
                </p>
                {message ? <p className="mb-3 text-sm font-bold text-cyan-800">{message}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "در حال ذخیره و استعلام…" : "ذخیره مشخصات"}
                  </Button>
                  {approved ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        hydrate(profile);
                        setMessage("");
                        setEditing(false);
                      }}
                    >
                      بازگشت به پنل
                    </Button>
                  ) : null}
                </div>
              </div>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
