"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
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
  const [baseList, setBaseList] = useState<InsuranceCompany[]>([]);
  const [compList, setCompList] = useState<InsuranceCompany[]>([]);

  const hydrate = useCallback((p: PatientProfile) => {
    setProfile(p);
    setPhone(p.phone);
    setName(p.name);
    setNationalId(p.nationalId || "");
    setBaseId(p.baseInsuranceId || "");
    setCompId(p.complementaryInsuranceId || "");
    setFranchise(String(p.franchisePercent ?? DEFAULT_FRANCHISE_PERCENT));
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

  async function sendOtp() {
    const digits = normalizePhone(phone);
    if (digits.length < 10) {
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
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setMessage(data.error || "ارسال کد ناموفق بود.");
        return;
      }
      setMessage(data.message || "کد ارسال شد.");
    } catch {
      setMessage("خطا در ارتباط با سرور.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    const digits = normalizePhone(phone);
    if (digits.length < 10 || !name.trim() || !otpCode.trim()) {
      setMessage("نام، موبایل و کد تأیید را وارد کنید.");
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
          name: name.trim(),
        }),
      });
      const data = (await res.json()) as { profile?: PatientProfile; error?: string };
      if (!res.ok || !data.profile) {
        setMessage(data.error || "ورود ناموفق بود.");
        return;
      }
      hydrate(data.profile);
      setMessage("وارد شدید.");
    } catch {
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
      setMessage(
        data.profile.status === "approved"
          ? "پروفایل ذخیره شد."
          : "پروفایل ذخیره شد و برای بررسی کارشناس در صف قرار گرفت.",
      );
    } catch {
      setMessage("خطا در ارتباط با سرور.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setProfile(null);
    setOtpCode("");
    setMessage("خارج شدید.");
  }

  if (!ready) {
    return <p className="py-10 text-center text-sm text-slate-500">در حال بارگذاری...</p>;
  }

  const helpHref = variant === "app" ? ROUTES.app.help : ROUTES.web.help;
  const complaintsHref = variant === "app" ? ROUTES.app.complaints : ROUTES.web.complaints;
  const installmentsHref =
    variant === "app" ? ROUTES.app.installments : ROUTES.web.installments;

  if (!profile) {
    return (
      <div className={variant === "app" ? "space-y-4" : "mx-auto max-w-lg px-4 py-10"}>
        <h1 className="mb-2 text-xl font-extrabold text-slate-900">ورود / ثبت‌نام بیمار</h1>
        <p className="mb-6 text-sm text-slate-600">
          مشخصات، بیمه پایه و تکمیلی و فرانشیز را در پنل کاربری مدیریت کنید.
        </p>
        <Card hover={false} className="space-y-3 p-5">
          <form onSubmit={login} className="space-y-3">
            <div>
              <FormLabel>نام و نام خانوادگی</FormLabel>
              <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <FormLabel>موبایل</FormLabel>
              <FormInput
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <FormLabel>کد تأیید</FormLabel>
              <div className="flex gap-2">
                <FormInput
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="00000"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 text-sm"
                  disabled={sendingOtp}
                  onClick={sendOtp}
                >
                  {sendingOtp ? "..." : "دریافت کد"}
                </Button>
              </div>
            </div>
            {message ? <p className="text-sm font-bold text-cyan-800">{message}</p> : null}
            <Button type="submit" className="w-full">
              ورود به پنل کاربری
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const samplePayable = payableFromFranchise(
    DEFAULT_VISIT_FEE_TOMAN,
    clampFranchisePercent(Number(franchise)),
  );

  return (
    <div className={variant === "app" ? "space-y-4" : "mx-auto max-w-2xl space-y-6 px-4 py-10"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">پنل کاربری</h1>
          <p className="mt-1 text-sm text-slate-500">{profile.phone}</p>
          <p
            className={`mt-2 text-sm font-bold ${
              isPatientApproved(profile) ? "text-teal-700" : "text-amber-700"
            }`}
          >
            وضعیت کاربری: {patientStatusLabel(profile.status)}
          </p>
        </div>
        <Button type="button" variant="outline" className="text-sm" onClick={logout}>
          خروج
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-sm font-bold">
        <Link href={installmentsHref} className="text-cyan-800 underline">
          اقساط من
        </Link>
        <span className="text-slate-300">|</span>
        <Link href={helpHref} className="text-cyan-800 underline">
          آموزش سامانه
        </Link>
        <span className="text-slate-300">|</span>
        <Link href={complaintsHref} className="text-cyan-800 underline">
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
              {formatPrice(DEFAULT_VISIT_FEE_TOMAN)} با فرانشیز {clampFranchisePercent(Number(franchise))}٪
              → مبلغ واریزی {formatPrice(samplePayable)}.
            </p>
            {message ? <p className="mb-3 text-sm font-bold text-cyan-800">{message}</p> : null}
            <Button type="submit">ذخیره مشخصات</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
