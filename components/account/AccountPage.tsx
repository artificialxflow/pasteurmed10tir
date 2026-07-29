"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import {
  clampFranchisePercent,
  DEFAULT_FRANCHISE_PERCENT,
  DEFAULT_VISIT_FEE_TOMAN,
  isPatientApproved,
  patientStatusLabel,
  payableFromFranchise,
  type PatientProfile,
} from "@/lib/patient";
import { formatPrice, normalizePhone } from "@/lib/utils";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export function AccountPage({ variant = "web" }: { variant?: "web" | "app" }) {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [baseId, setBaseId] = useState("");
  const [compId, setCompId] = useState("");
  const [franchise, setFranchise] = useState(String(DEFAULT_FRANCHISE_PERCENT));
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  const baseList = PasteurStorage.getBaseInsurances().filter((i) => i.active !== false);
  const compList = PasteurStorage.getComplementaryInsurances().filter((i) => i.active !== false);

  function hydrate(p: PatientProfile) {
    setProfile(p);
    setPhone(p.phone);
    setName(p.name);
    setNationalId(p.nationalId || "");
    setBaseId(p.baseInsuranceId || "");
    setCompId(p.complementaryInsuranceId || "");
    setFranchise(String(p.franchisePercent ?? DEFAULT_FRANCHISE_PERCENT));
  }

  useEffect(() => {
    PasteurStorage.initPatientDomainIfNeeded();
    PasteurStorage.hideMembershipInstallmentPlans();
    const session = PasteurStorage.getPatientSession();
    if (session) hydrate(session);
    setReady(true);
  }, []);

  function login(e: FormEvent) {
    e.preventDefault();
    const digits = normalizePhone(phone);
    if (digits.length < 10 || !name.trim()) {
      setMessage("نام و موبایل معتبر وارد کنید.");
      return;
    }
    const p = PasteurStorage.patientLogin(digits, name.trim());
    hydrate(p);
    setMessage("وارد شدید.");
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const percent = clampFranchisePercent(Number(franchise));
    const next = PasteurStorage.savePatientProfile({
      ...profile,
      name: name.trim(),
      nationalId: nationalId.trim() || undefined,
      baseInsuranceId: baseId || undefined,
      complementaryInsuranceId: compId || undefined,
      franchisePercent: percent,
    });
    hydrate(next);
    setMessage(
      next.status === "approved"
        ? "پروفایل ذخیره شد."
        : "پروفایل ذخیره شد و برای بررسی کارشناس در صف قرار گرفت.",
    );
  }

  function logout() {
    PasteurStorage.patientLogout();
    setProfile(null);
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
            <FormLabel>کد ملی (اختیاری)</FormLabel>
            <FormInput value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
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
