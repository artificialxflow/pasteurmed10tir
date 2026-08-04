"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormLabel, FormSelect } from "@/components/ui/Card";
import type { InsuranceMode, PatientProfile } from "@/lib/patient";
import {
  DEFAULT_VISIT_FEE_TOMAN,
  isPatientApproved,
  payableFromFranchise,
  resolveFranchisePercent,
} from "@/lib/patient";
import { PaymentFlow, type PendingPayment } from "@/lib/payment";
import { fetchPublic } from "@/lib/content/client";
import {
  createInsuranceInquiryApi,
  fetchPatientOps,
} from "@/lib/operations/client";
import { PasteurStorage } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

function SummaryRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  if (last) {
    return (
      <div className="flex justify-between pt-2 text-base">
        <span className="font-bold">{label}</span>
        <span className="font-bold text-teal-700">{value}</span>
      </div>
    );
  }
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function PaymentSummary({
  pending,
  amountLabel,
}: {
  pending: PendingPayment;
  amountLabel?: string;
}) {
  if (pending.kind === "booking") {
    return (
      <Card className="mb-6 space-y-3 p-6 text-sm" hover={false}>
        <h2 className="mb-1 text-lg font-bold">خلاصه رزرو</h2>
        <SummaryRow label="مراجع:" value={String(pending.patientName || "—")} />
        <SummaryRow label="موبایل:" value={String(pending.patientPhone || "—")} />
        <SummaryRow label="پزشک:" value={String(pending.doctorName || "—")} />
        <SummaryRow label="نوع خدمت:" value={String(pending.typeLabel || "—")} />
        <SummaryRow label="روز:" value={String(pending.day || "—")} />
        <SummaryRow label="زمان:" value={String(pending.timeLabel || "—")} />
        {pending.referralCode ? (
          <SummaryRow label="کد معرف:" value={String(pending.referralCode)} />
        ) : null}
        <SummaryRow
          label={amountLabel || "بیعانه رزرو نوبت:"}
          value={formatPrice(Number(pending.amount) || 0)}
          last
        />
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800">
          بیعانه رزرو در صورت لغو قابل استرداد نیست. اگر استعلام بیمه تأیید شود و کاربری بیمار تأیید
          شده باشد، مبلغ قابل پرداخت برابر درصد فرانشیز از هزینه ویزیت خواهد بود.
        </p>
      </Card>
    );
  }

  if (pending.planId === "shop-vip") {
    return (
      <Card className="mb-6 space-y-3 p-6 text-sm" hover={false}>
        <h2 className="mb-1 text-lg font-bold">VIP تجهیزات</h2>
        <SummaryRow label="نام:" value={String(pending.patientName || "—")} />
        <SummaryRow label="موبایل:" value={String(pending.patientPhone || "—")} />
        <SummaryRow
          label="حق عضویت:"
          value={formatPrice(
            Number(pending.amountToman || Number(pending.amount || 0) / 10) || 0,
          )}
          last
        />
      </Card>
    );
  }

  if (pending.kind === "membership") {
    return (
      <Card className="mb-6 space-y-3 p-6 text-sm" hover={false}>
        <h2 className="mb-1 text-lg font-bold">خلاصه عضویت</h2>
        <SummaryRow label="نام:" value={String(pending.patientName || "—")} />
        <SummaryRow label="طرح:" value={String(pending.planName || "—")} />
        {pending.membershipDurationLabel || pending.validityLabel ? (
          <SummaryRow
            label="مدت عضویت:"
            value={String(pending.membershipDurationLabel || pending.validityLabel)}
          />
        ) : null}
        <SummaryRow
          label="مبلغ واریزی:"
          value={formatPrice(Number(pending.amount) || 0)}
          last
        />
      </Card>
    );
  }

  return (
    <Card className="mb-6 space-y-3 p-6 text-sm" hover={false}>
      <h2 className="mb-1 text-lg font-bold">خلاصه پرداخت</h2>
      <SummaryRow label="مبلغ:" value={formatPrice(Number(pending.amount) || 0)} last />
    </Card>
  );
}

export function ConfirmPayment({ basePath }: { basePath: DentalBasePath }) {
  const router = useRouter();
  const app = isAppDental(basePath);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<InsuranceMode>("none");
  const [baseId, setBaseId] = useState("");
  const [compId, setCompId] = useState("");
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [inquiryStatus, setInquiryStatus] = useState<"none" | "pending" | "approved" | "rejected">(
    "none",
  );
  const [note, setNote] = useState("");
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [baseList, setBaseList] = useState<{ id: string; name: string; active?: boolean }[]>([]);
  const [compList, setCompList] = useState<{ id: string; name: string; active?: boolean }[]>([]);

  useEffect(() => {
    void fetchPublic<{ base: { id: string; name: string; active?: boolean }[]; complementary: { id: string; name: string; active?: boolean }[] }>(
      "/api/content/insurances",
    )
      .then((data) => {
        setBaseList(data.base.filter((i) => i.active !== false));
        setCompList(data.complementary.filter((i) => i.active !== false));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    PasteurStorage.initPatientDomainIfNeeded();
    const data = PasteurStorage.getPendingPayment() as PendingPayment | null;
    if (!data) {
      router.replace(app ? "/app/dental/general" : "/dental/general");
      return;
    }
    const deposit = Number(data.amount) || 200000;
    setDepositAmount(deposit);
    setPending(data);
    void fetchPublic<{ dentalReservationFee: number }>("/api/content/settings")
      .then((s) => setDepositAmount(Number(data.amount) || s.dentalReservationFee))
      .catch(() => {});
    void fetchPatientOps<{ profile: PatientProfile | null }>("/api/auth/me")
      .then((res) => {
        if (res.profile && res.profile.phone === String(data.patientPhone || "").trim()) {
          setProfile(res.profile);
          if (res.profile.baseInsuranceId) setBaseId(res.profile.baseInsuranceId);
          if (res.profile.complementaryInsuranceId) setCompId(res.profile.complementaryInsuranceId);
        }
      })
      .catch(() => {
        const local = PasteurStorage.getPatientProfile(String(data.patientPhone || ""));
        if (local) {
          setProfile(local);
          if (local.baseInsuranceId) setBaseId(local.baseInsuranceId);
          if (local.complementaryInsuranceId) setCompId(local.complementaryInsuranceId);
        }
      });
    setReady(true);
  }, [app, router]);

  function applyAmount(next: PendingPayment) {
    setPending(next);
    PasteurStorage.setPendingPayment(next);
  }

  function submitInquiry() {
    if (!pending || pending.kind !== "booking") return;
    if (mode === "none") {
      setNote("برای استعلام، نوع بیمه را انتخاب کنید.");
      return;
    }
    if (!isPatientApproved(profile)) {
      setNote("کاربری بیمار هنوز تأیید نشده است. ابتدا در پنل ادمین تأیید شود.");
      return;
    }
    const percent = resolveFranchisePercent(profile);
    const visitFee = Number(pending.visitFee) || DEFAULT_VISIT_FEE_TOMAN;
    void createInsuranceInquiryApi({
      phone: String(pending.patientPhone || ""),
      patientName: String(pending.patientName || ""),
      mode,
      baseInsuranceId: mode === "base" || mode === "both" ? baseId : undefined,
      complementaryInsuranceId:
        mode === "complementary" || mode === "both" ? compId : undefined,
      franchisePercent: percent,
      visitFee,
      depositAmount,
    })
      .then(({ inquiry }) => {
        setInquiryId(String(inquiry.id));
        setInquiryStatus("pending");
        setNote("درخواست استعلام ثبت شد. کارشناسان بررسی می‌کنند.");
      })
      .catch((e) => setNote(e instanceof Error ? e.message : "ثبت استعلام ناموفق"));
  }

  function simulateApprove() {
    if (!pending || !inquiryId) return;
    if (!isPatientApproved(profile)) {
      setNote("کاربری بیمار تأیید نشده؛ فرانشیز٪ اعمال نشد.");
      return;
    }
    const percent = resolveFranchisePercent(profile);
    const visitFee = Number(pending.visitFee) || DEFAULT_VISIT_FEE_TOMAN;
    const payable = payableFromFranchise(visitFee, percent);
    const next = {
      ...pending,
      amount: payable,
      visitFee,
      franchisePercent: percent,
      insuranceInquiryId: inquiryId,
      insuranceStatus: "approved",
      paymentLabel: `فرانشیز ${percent}٪ از هزینه ویزیت`,
    };
    applyAmount(next);
    setInquiryStatus("approved");
    setNote(
      `استعلام تأیید شد. هزینه ویزیت ${formatPrice(visitFee)} × ${percent}٪ = ${formatPrice(payable)}`,
    );
  }

  function clearInsurance() {
    if (!pending) return;
    const next = {
      ...pending,
      amount: depositAmount,
      insuranceInquiryId: undefined,
      insuranceStatus: undefined,
      paymentLabel: "بیعانه رزرو نوبت",
    };
    applyAmount(next);
    setInquiryId(null);
    setInquiryStatus("none");
    setMode("none");
    setNote("به بیعانه رزرو برگشتید.");
  }

  const onPay = () => {
    if (!pending || paying) return;
    setPaying(true);
    window.setTimeout(() => {
      void PaymentFlow.completePaymentAsync(pending)
        .then(() => router.push(PaymentFlow.defaultSuccessHref(pending)))
        .catch((e) => {
          setNote(e instanceof Error ? e.message : "پرداخت ناموفق");
          setPaying(false);
        });
    }, 1500);
  };

  const onFail = () => {
    if (!pending) return;
    PaymentFlow.markPaymentFailed(pending);
    router.push(`${basePath}/failed`);
  };

  const onCancel = () => {
    const href = PaymentFlow.cancelPayment(pending);
    router.push(href);
  };

  if (!ready || !pending) {
    return (
      <div className={app ? "" : "mx-auto max-w-lg px-4 py-10"}>
        <p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>
      </div>
    );
  }

  const amountLabel =
    inquiryStatus === "approved" ? "فرانشیز (پس از تأیید بیمه):" : "بیعانه رزرو نوبت:";

  return (
    <div className={app ? "space-y-4" : "mx-auto max-w-lg px-4 py-10"}>
      {!app ? (
        <>
          <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">تأیید نهایی</h1>
          <p className="mb-8 text-center text-slate-600">
            لطفاً اطلاعات را بررسی و پرداخت را انجام دهید
          </p>
        </>
      ) : null}

      <PaymentSummary pending={pending} amountLabel={amountLabel} />

      {pending.kind === "booking" ? (
        <Card hover={false} className="mb-6 space-y-3 border-cyan-100 p-5">
          <h2 className="font-extrabold text-slate-900">بیمه پایه / تکمیلی</h2>
          <p className="text-xs leading-6 text-slate-500">
            اکثر بیمه‌های تکمیلی به‌صورت آنلاین طرف قرارداد هستند. پس از استعلام و تأیید کارشناسان،
            فقط فرانشیز پرداخت می‌شود.
          </p>
          <div>
            <FormLabel>نوع پوشش</FormLabel>
            <FormSelect
              value={mode}
              onChange={(e) => setMode(e.target.value as InsuranceMode)}
            >
              <option value="none">بدون بیمه — پرداخت بیعانه</option>
              <option value="base">فقط بیمه پایه</option>
              <option value="complementary">فقط بیمه تکمیلی</option>
              <option value="both">پایه + تکمیلی</option>
            </FormSelect>
          </div>
          {mode === "base" || mode === "both" ? (
            <div>
              <FormLabel>بیمه پایه</FormLabel>
              <FormSelect value={baseId} onChange={(e) => setBaseId(e.target.value)}>
                <option value="">— انتخاب —</option>
                {baseList.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </FormSelect>
            </div>
          ) : null}
          {mode === "complementary" || mode === "both" ? (
            <div>
              <FormLabel>بیمه تکمیلی</FormLabel>
              <FormSelect value={compId} onChange={(e) => setCompId(e.target.value)}>
                <option value="">— انتخاب —</option>
                {compList.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </FormSelect>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="text-sm" onClick={submitInquiry} disabled={mode === "none"}>
              استعلام و بررسی کارشناسان
            </Button>
            {inquiryStatus === "pending" ? (
              <Button type="button" variant="accent" className="text-sm" onClick={simulateApprove}>
                شبیه‌سازی تأیید
              </Button>
            ) : null}
            {inquiryStatus !== "none" ? (
              <Button type="button" variant="outline" className="text-sm" onClick={clearInsurance}>
                بازگشت به بیعانه
              </Button>
            ) : null}
          </div>
          {note ? <p className="text-sm font-bold text-cyan-800">{note}</p> : null}
        </Card>
      ) : null}

      {!app ? (
        <Card className="mb-6 border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-800" hover={false}>
          🔒 اتصال امن به درگاه پرداخت — نسخه نمایشی فرانت.
        </Card>
      ) : null}

      <Button onClick={onPay} disabled={paying} className="mb-3 w-full py-3 text-base">
        {paying ? "در حال اتصال به درگاه..." : app ? "پرداخت موفق (نمایشی)" : "شبیه‌سازی پرداخت موفق"}
      </Button>
      <Button variant="danger" onClick={onFail} disabled={paying} className="mb-2 w-full">
        {app ? "پرداخت ناموفق" : "شبیه‌سازی پرداخت ناموفق"}
      </Button>
      {!app ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={paying}
          className="w-full py-2.5 text-sm text-slate-600 hover:text-slate-900"
        >
          انصراف و بازگشت
        </button>
      ) : null}
    </div>
  );
}
