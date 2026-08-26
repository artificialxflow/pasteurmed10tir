"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { type PendingPayment } from "@/lib/payment";
import {
  applyPaymentResultToStorage,
  fetchZibalPaymentResultApi,
  getPaymentIntentIdFromSearch,
  startZibalPaymentApi,
} from "@/lib/payment/zibal-client";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type ConsultationBasePath = "/consultation" | "/app/consultation";

function isAppConsultation(basePath: ConsultationBasePath): boolean {
  return basePath.startsWith("/app");
}

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

export function ConfirmConsultationPayment({ basePath }: { basePath: ConsultationBasePath }) {
  const router = useRouter();
  const app = isAppConsultation(basePath);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    PasteurStorage.initPatientDomainIfNeeded();
    const data = PasteurStorage.getPendingPayment() as PendingPayment | null;
    if (!data || data.kind !== "consultation") {
      router.replace(app ? ROUTES.app.consultation : ROUTES.web.consultation);
      return;
    }
    setPending(data);
    setReady(true);
  }, [app, router]);

  const onPay = () => {
    if (!pending || paying) return;
    setPaying(true);
    void startZibalPaymentApi({ pending, basePath })
      .then(({ redirectUrl }) => {
        window.location.href = redirectUrl;
      })
      .catch((e) => {
        setNote(e instanceof Error ? e.message : "اتصال به درگاه ناموفق");
        setPaying(false);
      });
  };

  const onCancel = () => {
    PasteurStorage.clearPendingPayment();
    router.push(app ? ROUTES.app.consultation : ROUTES.web.consultation);
  };

  if (!ready || !pending) {
    return (
      <div className={app ? "" : "mx-auto max-w-lg px-4 py-10"}>
        <p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>
      </div>
    );
  }

  const amountLabel = pending.paymentLabel
    ? String(pending.paymentLabel)
    : "مبلغ مشاوره یا ویزیت:";

  return (
    <div className={app ? "space-y-4" : "mx-auto max-w-lg px-4 py-10"}>
      {!app ? (
        <>
          <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">تأیید و پرداخت</h1>
          <p className="mb-8 text-center text-slate-600">
            لطفاً اطلاعات را بررسی و پرداخت را انجام دهید
          </p>
        </>
      ) : null}

      <Card className="mb-6 space-y-3 p-6 text-sm" hover={false}>
        <h2 className="mb-1 text-lg font-bold">خلاصه درخواست</h2>
        <SummaryRow label="مراجع:" value={String(pending.patientName || "—")} />
        <SummaryRow label="موبایل:" value={String(pending.patientPhone || "—")} />
        <SummaryRow label="دسته:" value={String(pending.categoryLabel || pending.category || "—")} />
        <SummaryRow label="نوع:" value={String(pending.typeLabel || pending.type || "—")} />
        {pending.specialtyLabel ? (
          <SummaryRow label="تخصص:" value={String(pending.specialtyLabel)} />
        ) : null}
        {pending.doctorName ? (
          <SummaryRow label="پزشک:" value={String(pending.doctorName)} />
        ) : null}
        <SummaryRow
          label={amountLabel}
          value={formatPrice(Number(pending.amount) || 0)}
          last
        />
      </Card>

      {!app ? (
        <Card className="mb-6 border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-800" hover={false}>
          🔒 پرداخت امن از طریق درگاه زیبال — پس از تأیید، به بانک منتقل می‌شوید.
        </Card>
      ) : null}

      {note ? <p className="text-sm font-bold text-red-600">{note}</p> : null}

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
      ) : (
        <Button type="button" variant="outline" onClick={onCancel} disabled={paying} className="w-full">
          انصراف
        </Button>
      )}
    </div>
  );
}

export function ConsultationPaymentSuccess({ basePath }: { basePath: ConsultationBasePath }) {
  const app = isAppConsultation(basePath);
  const consultationHref = app ? ROUTES.app.consultation : ROUTES.web.consultation;
  const [payment, setPayment] = useState<Record<string, unknown> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const intentId = getPaymentIntentIdFromSearch(window.location.search);
    if (intentId) {
      void fetchZibalPaymentResultApi(intentId)
        .then((result) => {
          applyPaymentResultToStorage(result.payment as Record<string, unknown>);
          setPayment(result.payment as Record<string, unknown>);
        })
        .catch(() => setPayment(PasteurStorage.getLastPayment()))
        .finally(() => setReady(true));
      return;
    }
    setPayment(PasteurStorage.getLastPayment());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className={app ? "" : "flex flex-1 items-center justify-center py-16"}>
        <p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>
      </div>
    );
  }

  const amount = Number(payment?.amount) || 0;

  return (
    <div className={app ? "space-y-4 text-center" : "flex flex-1 items-center justify-center py-16"}>
      <div className={app ? "" : "mx-auto max-w-md px-4 text-center"}>
        <div
          className={
            app
              ? "text-5xl"
              : "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-400 bg-green-100 text-4xl"
          }
        >
          ✅
        </div>
        <h1 className={app ? "text-lg font-extrabold text-slate-900" : "mb-2 text-2xl font-bold text-slate-900"}>
          {app ? "درخواست ثبت شد" : "پرداخت با موفقیت انجام شد!"}
        </h1>
        <p className={app ? "text-sm text-slate-500" : "mb-4 text-slate-600"}>
          {app
            ? "کارشناسان ظرف ۶ ساعت پاسخ می‌دهند."
            : "درخواست مشاوره یا ویزیت شما ثبت شد. کارشناسان ظرف ۶ ساعت هماهنگی می‌کنند."}
        </p>
        <p className="mb-6 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
          {amount > 0
            ? `مبلغ ${formatPrice(amount)} پرداخت شد. +۲۰ امتیاز باشگاه ثبت شد`
            : "+۲۰ امتیاز باشگاه ثبت شد"}
        </p>
        <Button href={consultationHref} className={app ? "w-full" : ""}>
          {app ? "بازگشت" : "درخواست جدید"}
        </Button>
        {!app ? (
          <Button href={ROUTES.web.home} variant="outline" className="mt-3">
            صفحه اصلی
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ConsultationPaymentFailed({ basePath }: { basePath: ConsultationBasePath }) {
  const app = isAppConsultation(basePath);
  const confirmHref = `${basePath}/confirm`;

  if (app) {
    return (
      <div className="space-y-4 text-center">
        <p className="m-0 text-5xl">❌</p>
        <h2 className="text-lg font-extrabold text-slate-900">پرداخت ناموفق</h2>
        <p className="text-sm text-slate-500">لطفاً دوباره تلاش کنید</p>
        <Button href={confirmHref} className="w-full">
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-400 bg-red-100 text-4xl">
          ❌
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">پرداخت ناموفق بود</h1>
        <p className="mb-8 text-slate-600">
          متأسفانه تراکنش انجام نشد. می‌توانید دوباره تلاش کنید.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href={confirmHref}>تلاش مجدد</Button>
          <Button href={ROUTES.web.consultation} variant="outline">
            بازگشت به فرم
          </Button>
        </div>
      </div>
    </div>
  );
}
