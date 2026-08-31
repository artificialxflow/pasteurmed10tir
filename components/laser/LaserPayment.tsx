"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PendingLaserPayment, PendingPayment } from "@/lib/payment";
import {
  completeFreeReservation,
  pendingPayableAmount,
  requiresOnlinePayment,
} from "@/lib/payment/free-reservation";
import { PaymentFlow } from "@/lib/payment";
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

export type LaserBasePath = "/laser" | "/app/laser";

function isAppLaser(basePath: LaserBasePath): boolean {
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
        <span className="font-bold text-purple-700">{value}</span>
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

export function ConfirmLaserPayment({ basePath }: { basePath: LaserBasePath }) {
  const router = useRouter();
  const app = isAppLaser(basePath);
  const [pending, setPending] = useState<PendingLaserPayment | null>(null);
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    PasteurStorage.initPatientDomainIfNeeded();
    const data = PasteurStorage.getPendingPayment() as PendingPayment | null;
    if (!data || data.kind !== "laser") {
      router.replace(app ? ROUTES.app.laser : ROUTES.web.laser);
      return;
    }
    setPending(data as PendingLaserPayment);
    setReady(true);
  }, [app, router]);

  const onPay = () => {
    if (!pending || paying) return;
    setPaying(true);
    const payable = pendingPayableAmount(pending);
    if (!requiresOnlinePayment(payable)) {
      void completeFreeReservation(pending)
        .then(() => {
          router.push(PaymentFlow.defaultSuccessHref(pending, basePath));
        })
        .catch((e) => {
          setNote(e instanceof Error ? e.message : "ثبت رزرو ناموفق");
          setPaying(false);
        });
      return;
    }
    void startZibalPaymentApi({ pending, basePath })
      .then(({ redirectUrl }) => {
        window.location.href = redirectUrl;
      })
      .catch((e) => {
        setNote(e instanceof Error ? e.message : "اتصال به درگاه ناموفق");
        setPaying(false);
      });
  };

  if (!ready || !pending) {
    return (
      <div className={app ? "p-4 text-sm text-slate-500" : "mx-auto max-w-md px-4 py-10 text-sm text-slate-500"}>
        در حال بارگذاری...
      </div>
    );
  }

  const amount = Number(pending.amountToman || pending.amount || 0);
  const tariff = Number(pending.tariffAmount || 0);
  const isFreeReservation = !requiresOnlinePayment(amount);
  const body = (
    <>
      {!app ? (
        <>
          <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
            {isFreeReservation ? "تأیید رزرو نوبت لیزر" : "تأیید بیعانه نوبت لیزر"}
          </h1>
          <p className="mb-8 text-center text-slate-600">
            {isFreeReservation
              ? "با تأیید، زمان انتخاب‌شده بدون پرداخت آنلاین رزرو می‌شود"
              : "با پرداخت بیعانه، زمان انتخاب‌شده رزرو می‌شود"}
          </p>
        </>
      ) : null}

      <Card className="mb-6 space-y-3 p-6 text-sm" hover={false}>
        <h2 className="mb-1 text-lg font-bold">خلاصه درخواست</h2>
        <SummaryRow label="مراجع:" value={String(pending.patientName || "—")} />
        <SummaryRow label="موبایل:" value={String(pending.patientPhone || "—")} />
        {pending.categoryName ? (
          <SummaryRow label="دسته:" value={String(pending.categoryName)} />
        ) : null}
        <SummaryRow label="خدمت:" value={String(pending.serviceTitle || "لیزر")} />
        <SummaryRow
          label="تاریخ نوبت:"
          value={String(pending.appointmentDateLabel || pending.day || "—")}
        />
        <SummaryRow label="ساعت:" value={String(pending.timeLabel || pending.timeValue || "—")} />
        {pending.description ? (
          <SummaryRow label="توضیحات:" value={String(pending.description)} />
        ) : null}
        {tariff > 0 ? (
          <SummaryRow label="تعرفه خدمت:" value={formatPrice(tariff)} />
        ) : null}
        <SummaryRow
          label={String(pending.paymentLabel || "بیعانه رزرو")}
          value={formatPrice(amount)}
          last
        />
      </Card>

      {note ? <p className="mb-3 text-sm font-bold text-red-600">{note}</p> : null}

      {isFreeReservation ? (
        <Card className="mb-6 border-purple-200 bg-purple-50 p-4 text-sm leading-7 text-purple-800" hover={false}>
          بیعانه رزرو صفر است؛ با تأیید، نوبت بدون پرداخت آنلاین ثبت می‌شود.
        </Card>
      ) : null}

      <Button onClick={onPay} disabled={paying} variant="accent" className="mb-3 w-full py-3 text-base">
        {paying
          ? isFreeReservation
            ? "در حال ثبت رزرو..."
            : "در حال اتصال به درگاه..."
          : isFreeReservation
            ? "تأیید و ثبت رزرو"
            : "پرداخت بیعانه و انتقال به درگاه"}
      </Button>
      <Button href={app ? ROUTES.app.laser : ROUTES.web.laser} variant="ghost" className="w-full">
        بازگشت
      </Button>
    </>
  );

  if (app) return <div className="p-4">{body}</div>;
  return <div className="mx-auto max-w-md px-4 py-10 sm:px-6">{body}</div>;
}

export function LaserPaymentSuccess({ basePath }: { basePath: LaserBasePath }) {
  const app = isAppLaser(basePath);
  const [ready, setReady] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [when, setWhen] = useState("");

  useEffect(() => {
    const intentId = getPaymentIntentIdFromSearch(window.location.search);
    const applyLast = () => {
      const last = PasteurStorage.getLastPayment();
      if (last?.kind === "laser") {
        setAmount(Number(last.amountToman || last.amount || 0));
        const date = String(last.appointmentDateLabel || last.day || "");
        const time = String(last.timeLabel || last.timeValue || "");
        setWhen([date, time].filter(Boolean).join(" — "));
      }
    };
    if (intentId) {
      void fetchZibalPaymentResultApi(intentId)
        .then((result) => {
          applyPaymentResultToStorage(result.payment as Record<string, unknown>);
          const p = result.payment as PendingLaserPayment;
          setAmount(Number(p.amountToman || p.amount || 0));
          const date = String(p.appointmentDateLabel || p.day || "");
          const time = String(p.timeLabel || p.timeValue || "");
          setWhen([date, time].filter(Boolean).join(" — "));
        })
        .catch(applyLast)
        .finally(() => setReady(true));
      return;
    }
    applyLast();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className={app ? "p-4 text-sm text-slate-500" : "mx-auto max-w-md px-4 py-10 text-sm text-slate-500"}>
        در حال بارگذاری...
      </div>
    );
  }

  const body = (
    <Card hover={false} className="p-8 text-center">
      <p className="text-5xl">✅</p>
      <h1 className="mt-3 text-xl font-bold text-slate-900">نوبت لیزر رزرو شد</h1>
      <p className="mt-2 text-sm text-slate-600">
        {amount != null && amount > 0
          ? "بیعانه ثبت شد و زمان انتخاب‌شده برای شما رزرو گردید."
          : "زمان انتخاب‌شده برای شما رزرو گردید."}
      </p>
      {when ? <p className="mt-3 text-sm font-bold text-slate-800">{when}</p> : null}
      {amount != null && amount > 0 ? (
        <p className="mt-4 text-lg font-extrabold text-purple-700">{formatPrice(amount)}</p>
      ) : null}
      <Button href={app ? ROUTES.app.laser : ROUTES.web.laser} variant="accent" className="mt-6 w-full">
        بازگشت به لیزر
      </Button>
      <Button
        href={app ? ROUTES.app.account : ROUTES.web.account}
        variant="outline"
        className="mt-3 w-full"
      >
        پنل کاربری
      </Button>
    </Card>
  );

  if (app) return body;
  return <div className="mx-auto max-w-md px-4 py-10 sm:px-6">{body}</div>;
}

export function LaserPaymentFailed({ basePath }: { basePath: LaserBasePath }) {
  const app = isAppLaser(basePath);
  const body = (
    <Card hover={false} className="p-8 text-center">
      <p className="text-5xl">❌</p>
      <h1 className="mt-3 text-xl font-bold text-slate-900">پرداخت ناموفق بود</h1>
      <p className="mt-2 text-sm text-slate-600">در صورت کسر وجه، طی ۷۲ ساعت به حساب بازمی‌گردد.</p>
      <Button
        href={app ? ROUTES.app.laserConfirm : ROUTES.web.laserConfirm}
        variant="accent"
        className="mt-6 w-full"
      >
        تلاش مجدد
      </Button>
      <Button href={app ? ROUTES.app.laser : ROUTES.web.laser} variant="ghost" className="mt-3 w-full">
        بازگشت
      </Button>
    </Card>
  );
  if (app) return body;
  return <div className="mx-auto max-w-md px-4 py-10 sm:px-6">{body}</div>;
}
