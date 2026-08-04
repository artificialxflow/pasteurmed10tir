"use client";

import { Button } from "@/components/ui/Button";
import {
  Card,
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/ui/Card";
import { PASTEUR_DATA, type Membership } from "@/lib/data";
import {
  calculateLoan,
  formatRial,
  formatToman,
  getDurationOptions,
  getLoanMonthOptions,
  getMembershipPlans,
  getMembershipPlansAsync,
  getUnitPrice,
  getValidityLabel,
  normalizeMemberCount,
  type MembershipTier,
} from "@/lib/membership";
import { ROUTES } from "@/lib/routes";
import {
  createMembershipApplicationApi,
  lookupVisitorApi,
} from "@/lib/commerce/client";
import { PasteurStorage } from "@/lib/storage";
import { cn, normalizePhone } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

type ApplicationForm = {
  date: string;
  referral: string;
  agentName: string;
  name: string;
  nationalId: string;
  age: string;
  job: string;
  postal: string;
  phone: string;
  homeAddress: string;
  workAddress: string;
  planId: string;
  tier: MembershipTier;
  memberCount: string;
  medicalHistory: string;
  loanAmount: string;
  dependents: [string, string, string, string];
};

type QuickModalState = {
  open: boolean;
  tier: MembershipTier | null;
  name: string;
  phone: string;
  memberCount: string;
  planId: string;
  referral: string;
};

const INITIAL_FORM: ApplicationForm = {
  date: "",
  referral: "",
  agentName: "",
  name: "",
  nationalId: "",
  age: "",
  job: "",
  postal: "",
  phone: "",
  homeAddress: "",
  workAddress: "",
  planId: "one-year",
  tier: "regular",
  memberCount: "1",
  medicalHistory: "",
  loanAmount: "",
  dependents: ["", "", "", ""],
};

export function MembershipPage({ basePath }: { basePath: DentalBasePath }) {
  const router = useRouter();
  const app = isAppDental(basePath);
  const [form, setForm] = useState<ApplicationForm>(INITIAL_FORM);
  const [membershipPlans, setMembershipPlans] = useState<Membership[]>(() =>
    getMembershipPlans(),
  );
  const durationOptions = useMemo(() => getDurationOptions(), []);
  const confirmHref = app ? ROUTES.app.dentalConfirm : ROUTES.web.dentalConfirm;
  const returnHref = app ? ROUTES.app.dentalMembership : ROUTES.web.dentalMembership;
  const successHref = app ? ROUTES.app.dentalSuccess : ROUTES.web.dentalSuccess;
  const dentalHref = app ? ROUTES.app.dental : ROUTES.web.dental;

  const plans = membershipPlans;
  const [loanTier, setLoanTier] = useState<MembershipTier>("regular");
  const [loanAmount, setLoanAmount] = useState("50000000");
  const [loanMonths, setLoanMonths] = useState(15);
  const [contractOpen, setContractOpen] = useState(false);
  const [error, setError] = useState("");
  const [quick, setQuick] = useState<QuickModalState>({
    open: false,
    tier: null,
    name: "",
    phone: "",
    memberCount: "1",
    planId: "one-year",
    referral: "",
  });

  const monthOptions = useMemo(
    () => getLoanMonthOptions(loanTier, membershipPlans),
    [loanTier, membershipPlans],
  );
  const loanResult = useMemo(
    () =>
      calculateLoan({
        tier: loanTier,
        amount: loanAmount,
        months: loanMonths,
        plans: membershipPlans,
      }),
    [loanTier, loanAmount, loanMonths, membershipPlans],
  );

  useEffect(() => {
    void getMembershipPlansAsync().then(setMembershipPlans);
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      date: prev.date || new Date().toLocaleDateString("fa-IR"),
    }));
  }, []);

  useEffect(() => {
    if (!monthOptions.includes(loanMonths)) {
      setLoanMonths(monthOptions[monthOptions.length - 1] || 15);
    }
  }, [monthOptions, loanMonths]);

  useEffect(() => {
    if (Number(loanAmount) > loanResult.limit) {
      setLoanAmount(String(loanResult.limit));
    }
  }, [loanAmount, loanResult.limit]);

  const unitPrice = getUnitPrice(form.tier, form.planId);
  const memberCount = normalizeMemberCount(form.memberCount);
  const amountToman = unitPrice * memberCount;
  const durationPlan = durationOptions.find((p) => p.id === form.planId);
  const validityLabel = getValidityLabel(form.tier, form.planId);
  const discountPercent = durationPlan?.discountPercent || 0;
  const amountPreview = `${formatToman(unitPrice)} برای هر نفر × ${memberCount.toLocaleString("fa-IR")} نفر = ${formatToman(amountToman)} | مدت عضویت: ${validityLabel}${
    discountPercent ? ` | تخفیف: ${discountPercent.toLocaleString("fa-IR")}٪` : ""
  }`;

  function updateForm<K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onReferralChange(value: string) {
    const code = value.toUpperCase();
    setForm((prev) => ({
      ...prev,
      referral: value,
    }));
    if (!code.trim()) {
      setForm((prev) => ({ ...prev, agentName: "" }));
      return;
    }
    void lookupVisitorApi(code)
      .then(({ visitor }) => {
        setForm((prev) => ({
          ...prev,
          agentName: visitor?.name || "",
        }));
      })
      .catch(() => {
        setForm((prev) => ({ ...prev, agentName: "" }));
      });
  }

  async function buildApplication() {
    const plan = durationOptions.find((p) => p.id === form.planId);
    const referralCode = form.referral.trim().toUpperCase();
    let visitorName = form.agentName || "—";
    if (referralCode) {
      try {
        const { visitor } = await lookupVisitorApi(referralCode);
        if (visitor?.name) visitorName = visitor.name;
      } catch {
        /* ignore */
      }
    }
    const count = normalizeMemberCount(form.memberCount);
    const unit = getUnitPrice(form.tier, form.planId);
    const total = unit * count;
    return {
      id: PasteurStorage.generateId(),
      date: form.date || new Date().toLocaleDateString("fa-IR"),
      referralCode,
      visitorName,
      patientName: form.name.trim(),
      nationalId: form.nationalId.trim(),
      age: form.age,
      job: form.job.trim(),
      postalCode: form.postal.trim(),
      phone: form.phone.trim(),
      homeAddress: form.homeAddress.trim(),
      workAddress: form.workAddress.trim(),
      planId: plan?.id,
      planTitle: plan ? `${plan.title} (${plan.duration})` : "—",
      validityLabel: getValidityLabel(form.tier, form.planId),
      membershipDurationLabel: getValidityLabel(form.tier, form.planId),
      discountPercent: plan?.discountPercent || 0,
      tier: form.tier,
      tierLabel: form.tier === "vip" ? "VIP" : "عادی",
      memberCount: count,
      unitPriceToman: unit,
      amountRial: total * 10,
      amountToman: total,
      medicalHistory: form.medicalHistory.trim(),
      loanAmount: form.loanAmount.trim() || loanAmount,
      dependents: form.dependents.map((d) => d.trim()).filter(Boolean),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  }

  function buildApplicationSync() {
    const plan = durationOptions.find((p) => p.id === form.planId);
    const referralCode = form.referral.trim().toUpperCase();
    const count = normalizeMemberCount(form.memberCount);
    const unit = getUnitPrice(form.tier, form.planId);
    const total = unit * count;
    return {
      id: PasteurStorage.generateId(),
      date: form.date || new Date().toLocaleDateString("fa-IR"),
      referralCode,
      visitorName: form.agentName || "—",
      patientName: form.name.trim(),
      nationalId: form.nationalId.trim(),
      age: form.age,
      job: form.job.trim(),
      postalCode: form.postal.trim(),
      phone: form.phone.trim(),
      homeAddress: form.homeAddress.trim(),
      workAddress: form.workAddress.trim(),
      planId: plan?.id,
      planTitle: plan ? `${plan.title} (${plan.duration})` : "—",
      validityLabel: getValidityLabel(form.tier, form.planId),
      membershipDurationLabel: getValidityLabel(form.tier, form.planId),
      discountPercent: plan?.discountPercent || 0,
      tier: form.tier,
      tierLabel: form.tier === "vip" ? "VIP" : "عادی",
      memberCount: count,
      unitPriceToman: unit,
      amountRial: total * 10,
      amountToman: total,
      medicalHistory: form.medicalHistory.trim(),
      loanAmount: form.loanAmount.trim() || loanAmount,
      dependents: form.dependents.map((d) => d.trim()).filter(Boolean),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  }

  async function submitApplication(e: FormEvent) {
    e.preventDefault();
    setError("");
    const data = await buildApplication();
    if (data.patientName.length < 2 || normalizePhone(data.phone).length < 10) {
      setError("نام و شماره تماس را کامل وارد کنید.");
      return;
    }
    try {
      await createMembershipApplicationApi(data as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت درخواست ناموفق بود.");
      return;
    }
    PasteurStorage.setPendingPayment({
      kind: "membership",
      planId: data.tier,
      planName: `${data.planTitle} — ${data.tierLabel} — ${data.memberCount} نفر`,
      patientName: data.patientName,
      patientPhone: data.phone,
      amount: data.amountToman,
      referralCode: data.referralCode,
      validityLabel: data.validityLabel,
      membershipDurationLabel: data.membershipDurationLabel,
      discountPercent: data.discountPercent,
      successTo: successHref,
      returnTo: returnHref,
    });
    router.push(confirmHref);
  }

  function submitQuick(e: FormEvent) {
    e.preventDefault();
    if (!quick.tier) return;
    const name = quick.name.trim();
    const phone = quick.phone.trim();
    const count = normalizeMemberCount(quick.memberCount);
    const unit = getUnitPrice(quick.tier, quick.planId);
    const membershipDurationLabel = getValidityLabel(quick.tier, quick.planId);
    const plan = durationOptions.find((p) => p.id === quick.planId);
    const membership = membershipPlans.find((m) => m.id === quick.tier);
    if (name.length < 2 || normalizePhone(phone).length < 10) {
      setError("اطلاعات را کامل وارد کنید.");
      return;
    }
    PasteurStorage.setPendingPayment({
      kind: "membership",
      planId: quick.tier,
      planName: `${membership?.name || quick.tier} — عضویت ${membershipDurationLabel} — ${count} نفر`,
      patientName: name,
      patientPhone: phone,
      amount: unit * count,
      validityLabel: membershipDurationLabel,
      membershipDurationLabel,
      discountPercent: plan?.discountPercent || 0,
      referralCode: quick.referral.trim().toUpperCase(),
      successTo: successHref,
      returnTo: returnHref,
    });
    router.push(confirmHref);
  }

  const contractData = buildApplicationSync();

  const shell = (
    <>
      {/* Hero */}
      <div
        className={cn(
          "mb-8 rounded-[1.25rem] border border-cyan-200 bg-gradient-to-bl from-cyan-50 to-amber-50 p-6 text-center sm:p-8",
          app && "mb-4 p-4 text-right",
        )}
      >
        {!app ? (
          <>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-bold text-cyan-800">
              عضویت بیماران دندان
            </span>
            <h1 className="mb-2 text-2xl font-extrabold text-slate-950 sm:text-4xl">
              💎 عضویت دندانپزشکی پاستور پلاس
            </h1>
            <p className="mx-auto max-w-xl text-slate-600">
              برای بیماران دندان فقط دو مسیر ساده داریم: عادی یا VIP. شرایط VIP را ببینید و بعد
              انتخاب کنید.
            </p>
          </>
        ) : (
          <>
            <p className="text-base font-extrabold text-slate-900">عضویت دندانپزشکی</p>
            <p className="mt-1 text-sm text-slate-600">عادی یا VIP — یک‌ساله / دوساله</p>
          </>
        )}
      </div>

      {/* Plan cards */}
      <div className={cn("grid gap-5", app ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
        {plans.map((m) => (
          <Card
            key={m.id}
            vip={m.highlighted}
            className={cn("relative flex flex-col p-6", app && "p-4")}
          >
            {m.highlighted && !app ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                ویژه بیماران VIP
              </span>
            ) : null}
            <div className={cn("mb-4 text-center", app && "text-right")}>
              <span className="text-4xl">{m.id === "vip" ? "💎" : "🦷"}</span>
              <h2 className="mt-2 text-xl font-bold">{m.name}</h2>
            </div>
            <p
              className={cn(
                "my-4 text-center text-2xl font-bold",
                m.id === "vip" ? "text-amber-700" : "text-teal-700",
                app && "my-2 text-right text-lg",
              )}
            >
              {m.price}{" "}
              <span className="text-sm font-normal text-slate-500">تومان / هر نفر</span>
            </p>
            <p
              className={cn(
                "mb-4 rounded-xl border px-3 py-2 text-center text-xs font-bold",
                m.id === "vip"
                  ? "border-amber-100 bg-amber-50 text-amber-700"
                  : "border-cyan-100 bg-cyan-50 text-cyan-700",
              )}
            >
              بازپرداخت وام درمانی: {m.loanTermLabel} — سقف {formatToman(m.loanLimit)}
            </p>
            <p
              className={cn(
                "mb-4 rounded-xl border px-3 py-2 text-center text-xs font-bold",
                m.id === "vip"
                  ? "border-amber-200 bg-amber-100/60 text-amber-800"
                  : "border-cyan-200 bg-cyan-100/60 text-cyan-800",
              )}
            >
              پیش‌پرداخت {m.downPaymentPercent.toLocaleString("fa-IR")}٪ — مثال برای ۵۰
              میلیون: {formatToman(Math.round(50000000 * m.downPaymentPercent / 100))}
            </p>
            {!app ? (
              <>
                <ul className="mb-4 flex-1 space-y-2 text-sm text-slate-600">
                  {m.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-teal-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mb-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {m.terms}
                </p>
                <Button
                  variant={m.id === "vip" ? "accent" : "primary"}
                  className="w-full text-sm"
                  onClick={() => {
                    setError("");
                    setQuick({
                      open: true,
                      tier: m.id as MembershipTier,
                      name: "",
                      phone: "",
                      memberCount: "1",
                      planId: "one-year",
                      referral: "",
                    });
                  }}
                >
                  پرداخت و عضویت
                </Button>
              </>
            ) : (
              <Button
                variant={m.id === "vip" ? "accent" : "primary"}
                className="w-full text-sm"
                onClick={() => {
                  updateForm("tier", m.id as MembershipTier);
                  setLoanTier(m.id as MembershipTier);
                }}
              >
                انتخاب طرح {m.name}
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Common services */}
      <section
        className={cn(
          "mt-10 rounded-[1.25rem] border border-cyan-200 bg-cyan-50/70 p-6",
          app && "mt-4 p-4",
        )}
      >
        <h2 className="mb-4 text-xl font-extrabold text-slate-900 sm:text-2xl">
          خدمات عمومی مشترک
        </h2>
        <div className={cn("grid gap-3", app ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
          {PASTEUR_DATA.membershipCommonServices.map((service) => (
            <div
              key={service}
              className="flex gap-2 rounded-xl border border-cyan-100 bg-white/80 p-3 text-sm text-slate-700"
            >
              <span className="text-cyan-600">✓</span>
              <span>{service}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Loan calculator */}
      <section
        className={cn(
          "mt-10 rounded-[1.25rem] border border-sky-200 bg-white p-6",
          app && "mt-4 p-4",
        )}
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              محاسبه‌گر اقساط وام درمانی
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              سود وام ۱۲٪ است؛ پیش‌پرداخت از مبلغ وام کسر شده و اقساط روی مانده محاسبه
              می‌شود.
            </p>
          </div>
          <span className="inline-flex rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
            وام درمانی ۱۲٪
          </span>
        </div>
        <div className={cn("grid gap-4", app ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4")}>
          <div>
            <FormLabel>نوع طرح</FormLabel>
            <FormSelect
              value={loanTier}
              onChange={(e) => setLoanTier(e.target.value as MembershipTier)}
            >
              <option value="regular">عادی</option>
              <option value="vip">VIP</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>مبلغ وام به تومان</FormLabel>
            <FormInput
              type="number"
              min={1000000}
              step={1000000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
            />
          </div>
          <div>
            <FormLabel>مدت بازپرداخت</FormLabel>
            <FormSelect
              value={loanMonths}
              onChange={(e) => setLoanMonths(Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m.toLocaleString("fa-IR")} ماهه
                </option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>سود سالانه</FormLabel>
            <div className="rounded-xl border border-sky-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
              ۱۲٪
            </div>
          </div>
        </div>
        <div className={cn("mt-5 grid gap-3", app ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-5")}>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs text-slate-500">سقف وام {loanResult.plan.name}</p>
            <p className="mt-1 font-extrabold text-cyan-800">{formatToman(loanResult.limit)}</p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <p className="text-xs text-slate-500">
              پیش‌پرداخت ({loanResult.downPaymentPercent.toLocaleString("fa-IR")}٪)
            </p>
            <p className="mt-1 font-extrabold text-violet-800">
              {formatToman(loanResult.downPaymentAmount)}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-xs text-slate-500">مانده وام (پس از پیش‌پرداخت)</p>
            <p className="mt-1 font-extrabold text-sky-800">{formatToman(loanResult.remaining)}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs text-slate-500">جمع بازپرداخت با سود ۱۲٪</p>
            <p className="mt-1 font-extrabold text-amber-800">
              {formatToman(loanResult.totalRepayment)}
            </p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-xs text-slate-500">
              مبلغ هر قسط {loanResult.months.toLocaleString("fa-IR")} ماهه
            </p>
            <p className="mt-1 font-extrabold text-teal-800">
              {formatToman(loanResult.installment)}
            </p>
          </div>
        </div>
      </section>

      {/* Coverage table */}
      <section className={cn("mt-10", app && "mt-4")}>
        <h2 className="mb-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
          فرم پیشنهاد صدور عضویت
        </h2>
        <p className="mb-5 text-sm text-slate-600">
          بر اساس فرم ارسالی، پوشش عادی یا VIP را برای مجموعه انتخاب کنید.
        </p>
        <Card className="mb-5 overflow-x-auto p-5" hover={false}>
          {app ? (
            <div className="space-y-3">
              {durationOptions.map((plan) => (
                <div
                  key={plan.id}
                  className="grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                >
                  <span>
                    <strong>{plan.title}</strong>
                    <br />
                    <span className="text-slate-500">{plan.duration}</span>
                    {plan.discountPercent ? (
                      <span className="mt-1 block text-amber-700">
                        تخفیف {plan.discountPercent.toLocaleString("fa-IR")}٪
                      </span>
                    ) : null}
                  </span>
                  <span className="text-center">
                    عادی
                    <br />
                    <strong>{formatToman(plan.regularPerPerson)}</strong>
                  </span>
                  <span className="text-center">
                    VIP
                    <br />
                    <strong className="text-amber-700">{formatToman(plan.vipPerPerson)}</strong>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full min-w-[680px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-3">مدت عضویت</th>
                  <th className="p-3">تخفیف</th>
                  <th className="p-3">عادی / هر نفر</th>
                  <th className="p-3">VIP / هر نفر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {durationOptions.map((plan) => (
                  <tr key={plan.id}>
                    <td className="p-3 font-bold">
                      {plan.title} — {plan.duration}
                    </td>
                    <td className="p-3">
                      {plan.discountPercent
                        ? `${plan.discountPercent.toLocaleString("fa-IR")}٪`
                        : "—"}
                    </td>
                    <td className="p-3">{formatToman(plan.regularPerPerson)}</td>
                    <td className="p-3 font-bold text-amber-700">
                      {formatToman(plan.vipPerPerson)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <form
          onSubmit={submitApplication}
          className="space-y-5 rounded-[1.25rem] border border-sky-200 bg-white/95 p-6"
        >
          <div className={cn("grid gap-4", app ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
            <div>
              <FormLabel>تاریخ</FormLabel>
              <FormInput
                value={form.date}
                onChange={(e) => updateForm("date", e.target.value)}
              />
            </div>
            <div>
              <FormLabel>کد نمایندگی / معرف</FormLabel>
              <FormInput
                value={form.referral}
                onChange={(e) => onReferralChange(e.target.value)}
                placeholder="PLUS100"
              />
            </div>
            <div>
              <FormLabel>نام نماینده</FormLabel>
              <FormInput
                value={form.agentName}
                readOnly
                placeholder="به‌صورت خودکار در صورت کد معتبر"
                className="bg-slate-50"
              />
            </div>
          </div>

          <div className={cn("grid gap-4", app ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
            <div>
              <FormLabel>نام و نام خانوادگی مشتری</FormLabel>
              <FormInput
                required
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />
            </div>
            <div>
              <FormLabel>کد ملی</FormLabel>
              <FormInput
                value={form.nationalId}
                onChange={(e) => updateForm("nationalId", e.target.value)}
              />
            </div>
            <div>
              <FormLabel>سن</FormLabel>
              <FormInput
                type="number"
                value={form.age}
                onChange={(e) => updateForm("age", e.target.value)}
              />
            </div>
            <div>
              <FormLabel>شغل</FormLabel>
              <FormInput
                value={form.job}
                onChange={(e) => updateForm("job", e.target.value)}
              />
            </div>
            <div>
              <FormLabel>کد پستی</FormLabel>
              <FormInput
                value={form.postal}
                onChange={(e) => updateForm("postal", e.target.value)}
              />
            </div>
            <div>
              <FormLabel>شماره تماس</FormLabel>
              <FormInput
                type="tel"
                required
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
              />
            </div>
          </div>

          <div className={cn("grid gap-4", app ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
            <div>
              <FormLabel>نشانی دقیق منزل</FormLabel>
              <FormTextarea
                value={form.homeAddress}
                onChange={(e) => updateForm("homeAddress", e.target.value)}
              />
            </div>
            <div>
              <FormLabel>نشانی دقیق محل کار</FormLabel>
              <FormTextarea
                value={form.workAddress}
                onChange={(e) => updateForm("workAddress", e.target.value)}
              />
            </div>
          </div>

          <div className={cn("grid gap-4", app ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
            <div>
              <FormLabel>مدت عضویت</FormLabel>
              <FormSelect
                required
                value={form.planId}
                onChange={(e) => updateForm("planId", e.target.value)}
              >
                {durationOptions.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title} — {plan.duration}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>نوع پوشش</FormLabel>
              <FormSelect
                required
                value={form.tier}
                onChange={(e) => updateForm("tier", e.target.value as MembershipTier)}
              >
                <option value="regular">عادی</option>
                <option value="vip">VIP</option>
              </FormSelect>
            </div>
            <div>
              <FormLabel>تعداد اعضا</FormLabel>
              <FormInput
                type="number"
                min={1}
                required
                value={form.memberCount}
                onChange={(e) => updateForm("memberCount", e.target.value)}
              />
            </div>
            <div>
              <FormLabel>حق عضویت محاسبه‌شده</FormLabel>
              <div className="rounded-xl border border-sky-200 bg-cyan-50 px-3 py-2.5 text-sm font-bold text-cyan-800">
                {amountPreview}
              </div>
            </div>
            <div>
              <FormLabel>مبلغ وام درخواستی (تومان)</FormLabel>
              <FormInput
                type="number"
                min={0}
                value={form.loanAmount}
                onChange={(e) => updateForm("loanAmount", e.target.value)}
                placeholder={loanAmount}
              />
            </div>
          </div>

          <div>
            <FormLabel>در صورت داشتن بیماری یا سابقه بیماری توضیح دهید</FormLabel>
            <FormTextarea
              value={form.medicalHistory}
              onChange={(e) => updateForm("medicalHistory", e.target.value)}
            />
          </div>

          <div>
            <FormLabel>مشخصات اعضای تحت پوشش مجموعه</FormLabel>
            <div className={cn("grid gap-3", app ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
              {form.dependents.map((dep, idx) => (
                <FormInput
                  key={idx}
                  value={dep}
                  onChange={(e) => {
                    const next = [...form.dependents] as ApplicationForm["dependents"];
                    next[idx] = e.target.value;
                    updateForm("dependents", next);
                  }}
                  placeholder={`نام و نام خانوادگی / کد ملی نفر ${["اول", "دوم", "سوم", "چهارم"][idx]}`}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            این قرارداد بر اساس شرایط عضویت پاستور پلاس و خدمات تاییدشده دندانپزشکی ثبت می‌شود.
          </div>

          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button type="button" variant="accent" onClick={() => setContractOpen(true)}>
              پیش‌نمایش قرارداد
            </Button>
            <Button type="submit" variant="primary">
              ثبت فرم و ادامه پرداخت
            </Button>
          </div>
        </form>
      </section>

      {/* Contract modal */}
      {contractOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-[1.25rem] border border-sky-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">پیش‌نمایش قرارداد عضویت</h2>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1"
                onClick={() => setContractOpen(false)}
              >
                بستن
              </button>
            </div>
            <div className="rounded-xl border-2 border-slate-900 p-4 text-sm leading-7">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Clinique Pasteur | پاستور پلاس"
                  className="h-12 w-auto max-w-[8rem] object-contain"
                />
                <div className="flex-1 text-center">
                  <p className="text-lg font-extrabold">فرم پیشنهاد صدور عضویت</p>
                  <p className="text-slate-500">پاستور پلاس</p>
                </div>
                <p className="text-xs text-slate-500">تاریخ: {contractData.date || "—"}</p>
              </div>
              <p>
                <strong>کد نمایندگی:</strong> {contractData.referralCode || "—"} |{" "}
                <strong>نام نماینده:</strong> {contractData.visitorName}
              </p>
              <p>
                <strong>نام مشتری:</strong> {contractData.patientName || "—"} |{" "}
                <strong>کد ملی:</strong> {contractData.nationalId || "—"} |{" "}
                <strong>تماس:</strong> {contractData.phone || "—"}
              </p>
              <p>
                <strong>مدت عضویت:</strong> {contractData.planTitle} | <strong>پوشش:</strong>{" "}
                {contractData.tierLabel} | <strong>تعداد اعضا:</strong>{" "}
                {contractData.memberCount.toLocaleString("fa-IR")} نفر
              </p>
              <p>
                <strong>مبلغ هر نفر:</strong> {formatToman(contractData.unitPriceToman)} |{" "}
                <strong>مبلغ کل:</strong> {formatRial(contractData.amountRial)}
              </p>
              <p>
                <strong>وام درخواستی:</strong>{" "}
                {contractData.loanAmount
                  ? formatToman(Number(contractData.loanAmount))
                  : "—"}
              </p>
              <p>
                <strong>اعضای تحت پوشش مجموعه:</strong>{" "}
                {contractData.dependents.length
                  ? contractData.dependents.join("، ")
                  : "—"}
              </p>
              <p className="mt-4 border-t border-dashed border-slate-300 pt-3">
                این قرارداد بر اساس شرایط عضویت پاستور پلاس، تعداد{" "}
                {contractData.memberCount.toLocaleString("fa-IR")} عضو مجموعه، مدت عضویت{" "}
                {contractData.membershipDurationLabel} و به مبلغ{" "}
                {formatRial(contractData.amountRial)} صادر می‌شود. این فرم فقط بر اساس خدمات
                تاییدشده دندانپزشکی و شرایط عمومی عضویت صادر می‌شود.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-500">
                <span>امضا نماینده فروش</span>
                <span>امضا و اثر انگشت متقاضی</span>
                <span>مهر و امضا مجموعه</span>
              </div>
            </div>
            <Button
              variant="primary"
              className="mt-5 w-full"
              onClick={() => window.print()}
            >
              چاپ فرم
            </Button>
          </div>
        </div>
      ) : null}

      {/* Quick membership modal (web) */}
      {quick.open && quick.tier ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[1.25rem] border border-sky-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">
              عضویت {membershipPlans.find((m) => m.id === quick.tier)?.name}
            </h2>
            <form onSubmit={submitQuick} className="space-y-4">
              <div>
                <FormLabel>نام و نام خانوادگی</FormLabel>
                <FormInput
                  required
                  value={quick.name}
                  onChange={(e) => setQuick((q) => ({ ...q, name: e.target.value }))}
                />
              </div>
              <div>
                <FormLabel>شماره موبایل</FormLabel>
                <FormInput
                  type="tel"
                  required
                  value={quick.phone}
                  onChange={(e) => setQuick((q) => ({ ...q, phone: e.target.value }))}
                />
              </div>
              <div>
                <FormLabel>تعداد اعضا</FormLabel>
                <FormInput
                  type="number"
                  min={1}
                  required
                  value={quick.memberCount}
                  onChange={(e) => setQuick((q) => ({ ...q, memberCount: e.target.value }))}
                />
              </div>
              <div>
                <FormLabel>مدت عضویت</FormLabel>
                <FormSelect
                  value={quick.planId}
                  onChange={(e) => setQuick((q) => ({ ...q, planId: e.target.value }))}
                >
                  {durationOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title} — {plan.duration}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-sm font-bold text-cyan-800">
                {(() => {
                  const count = normalizeMemberCount(quick.memberCount);
                  const unit = getUnitPrice(quick.tier!, quick.planId);
                  const plan = durationOptions.find((p) => p.id === quick.planId);
                  const disc = plan?.discountPercent
                    ? ` | تخفیف: ${plan.discountPercent.toLocaleString("fa-IR")}٪`
                    : "";
                  return `${formatToman(unit)} برای هر نفر × ${count.toLocaleString("fa-IR")} نفر = ${formatToman(unit * count)} | مدت عضویت: ${getValidityLabel(quick.tier!, quick.planId)}${disc}`;
                })()}
              </div>
              <div>
                <FormLabel>کد معرف ویزیتور (اختیاری)</FormLabel>
                <FormInput
                  value={quick.referral}
                  onChange={(e) => setQuick((q) => ({ ...q, referral: e.target.value }))}
                  placeholder="مثلاً PLUS100"
                />
              </div>
              <p className="text-xs text-slate-500">
                {membershipPlans.find((m) => m.id === quick.tier)?.terms}
              </p>
              {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 border-2 border-slate-200"
                  onClick={() => setQuick((q) => ({ ...q, open: false }))}
                >
                  انصراف
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  پرداخت و تأیید نهایی
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );

  if (app) return <div className="space-y-1">{shell}</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href={dentalHref} className="hover:text-teal-700">
          دندانپزشکی
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">طرح‌های عضویت</span>
      </nav>
      {shell}
    </div>
  );
}
