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
import { startZibalPaymentApi } from "@/lib/payment/zibal-client";
import { fetchPublic } from "@/lib/content/client";
import {
  createInsuranceInquiryApi,
  fetchPatientOps,
  getInsuranceInquiryApi,
} from "@/lib/operations/client";
import { PasteurStorage } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
        <SummaryRow label="تاریخ نوبت:" value={String(pending.appointmentDateLabel || pending.day || "—")} />
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
          مبلغ بیعانه رزرو از مبلغ صورتحسابتان کسر خواهد شد. مبلغ رزرو وقت ثابت است و قابل ویرایش
          نیست.
          <span className="mt-2 block">
            بیعانه رزرو در صورت لغو قابل استرداد نیست. اگر استعلام بیمه تأیید شود و کاربری بیمار تأیید
            شده باشد، مبلغ قابل پرداخت برابر درصد فرانشیز از هزینه ویزیت خواهد بود.
          </span>
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
        {pending.discountPercent ? (
          <SummaryRow
            label="تخفیف مدت:"
            value={`${Number(pending.discountPercent).toLocaleString("fa-IR")}٪`}
          />
        ) : null}
        {pending.groupDiscountPercent ? (
          <SummaryRow
            label="تخفیف مجموعه:"
            value={`${Number(pending.groupDiscountPercent).toLocaleString("fa-IR")}٪`}
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
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [baseList, setBaseList] = useState<{ id: string; name: string; active?: boolean }[]>([]);
  const [compList, setCompList] = useState<{ id: string; name: string; active?: boolean }[]>([]);

  const refreshProfile = useCallback(async (patientPhone?: string) => {
    setRefreshingProfile(true);
    try {
      const res = await fetchPatientOps<{ profile: PatientProfile | null }>("/api/auth/me");
      if (res.profile && (!patientPhone || res.profile.phone === patientPhone.trim())) {
        setProfile(res.profile);
        if (res.profile.baseInsuranceId) setBaseId(res.profile.baseInsuranceId);
        if (res.profile.complementaryInsuranceId) {
          setCompId(res.profile.complementaryInsuranceId);
        }
        return res.profile;
      }
    } catch {
      const local = patientPhone
        ? PasteurStorage.getPatientProfile(String(patientPhone))
        : null;
      if (local) {
        setProfile(local);
        if (local.baseInsuranceId) setBaseId(local.baseInsuranceId);
        if (local.complementaryInsuranceId) setCompId(local.complementaryInsuranceId);
        return local;
      }
    } finally {
      setRefreshingProfile(false);
    }
    return null;
  }, []);

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
    const storedInquiryId = data.insuranceInquiryId ? String(data.insuranceInquiryId) : null;
    if (storedInquiryId) {
      setInquiryId(storedInquiryId);
      const storedStatus = String(data.insuranceStatus || "");
      if (storedStatus === "approved" || storedStatus === "rejected" || storedStatus === "pending") {
        setInquiryStatus(storedStatus);
      } else {
        setInquiryStatus("pending");
      }
    }
    void fetchPublic<{ dentalReservationFee: number }>("/api/content/settings")
      .then((s) => setDepositAmount(Number(data.amount) || s.dentalReservationFee))
      .catch(() => {});
    void refreshProfile(String(data.patientPhone || ""));
    setReady(true);
  }, [app, router, refreshProfile]);

  useEffect(() => {
    function onFocus() {
      if (!pending) return;
      void refreshProfile(String(pending.patientPhone || ""));
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [pending, refreshProfile]);

  useEffect(() => {
    if (!pending || isPatientApproved(profile)) return;
    const timer = window.setInterval(() => {
      void refreshProfile(String(pending.patientPhone || ""));
    }, 20000);
    return () => window.clearInterval(timer);
  }, [pending, profile, refreshProfile]);

  function applyAmount(next: PendingPayment) {
    setPending(next);
    PasteurStorage.setPendingPayment(next);
  }

  function applyApprovedInquiry(id: string) {
    if (!pending) return;
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
      insuranceInquiryId: id,
      insuranceStatus: "approved",
      paymentLabel: `فرانشیز ${percent}٪ از هزینه ویزیت`,
    };
    applyAmount(next);
    setInquiryStatus("approved");
    setNote(
      `استعلام تأیید شد. هزینه ویزیت ${formatPrice(visitFee)} × ${percent}٪ = ${formatPrice(payable)}`,
    );
  }

  useEffect(() => {
    if (!inquiryId || inquiryStatus !== "pending" || !pending) return;

    let cancelled = false;
    const sync = () => {
      void getInsuranceInquiryApi(inquiryId)
        .then(({ inquiry }) => {
          if (cancelled) return;
          const status = String(inquiry.status || "");
          if (status === "approved") {
            applyApprovedInquiry(inquiryId);
          } else if (status === "rejected") {
            setInquiryStatus("rejected");
            setNote("استعلام بیمه رد شد. می‌توانید با بیعانه ادامه دهید.");
          }
        })
        .catch(() => {});
    };

    sync();
    const timer = window.setInterval(sync, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [inquiryId, inquiryStatus, pending, profile]);

  function submitInquiry() {
    if (!pending || pending.kind !== "booking") return;
    if (mode === "none") {
      setNote("برای استعلام، نوع بیمه را انتخاب کنید.");
      return;
    }
    if (!isPatientApproved(profile)) {
      setNote(
        "کاربری بیمار هنوز تأیید نشده. ابتدا پروفایل را در /account تکمیل کنید؛ سپس کارشناس در /admin/patients تأیید می‌کند (یا شاهکار خودکار).",
      );
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
        const id = String(inquiry.id);
        setInquiryId(id);
        setInquiryStatus("pending");
        setNote("درخواست استعلام ثبت شد. کارشناسان بررسی می‌کنند.");
        applyAmount({
          ...pending,
          insuranceInquiryId: id,
          insuranceStatus: "pending",
        });
      })
      .catch((e) => setNote(e instanceof Error ? e.message : "ثبت استعلام ناموفق"));
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
    void startZibalPaymentApi({ pending, basePath })
      .then(({ redirectUrl }) => {
        window.location.href = redirectUrl;
      })
      .catch((e) => {
        setNote(e instanceof Error ? e.message : 'اتصال به درگاه ناموفق');
        setPaying(false);
      });
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-extrabold text-slate-900">بیمه پایه / تکمیلی</h2>
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              disabled={refreshingProfile}
              onClick={() => void refreshProfile(String(pending.patientPhone || ""))}
            >
              {refreshingProfile ? "…" : "بروزرسانی وضعیت کاربری"}
            </Button>
          </div>
          {!isPatientApproved(profile) ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
              تأیید کاربری:{" "}
              <Link href="/account" className="font-bold underline">
                تکمیل پروفایل
              </Link>
              {" · "}
              کارشناس:{" "}
              <Link href="/admin/patients" className="font-bold underline">
                /admin/patients
              </Link>
              . استعلام پرداخت بیمه جداگانه در{" "}
              <Link href="/admin/insurances" className="font-bold underline">
                /admin/insurances
              </Link>{" "}
              تأیید می‌شود.
            </p>
          ) : null}
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
          🔒 پرداخت امن از طریق درگاه زیبال — پس از تأیید، به بانک منتقل می‌شوید.
        </Card>
      ) : null}

      <Button onClick={onPay} disabled={paying} className="mb-3 w-full py-3 text-base">
        {paying ? "در حال اتصال به درگاه..." : "پرداخت و انتقال به درگاه"}
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
