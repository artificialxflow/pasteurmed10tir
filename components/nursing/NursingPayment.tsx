"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PendingNursingPayment, PendingPayment } from "@/lib/payment";
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

export type NursingBasePath = "/nursing" | "/app/nursing";

function isAppNursing(basePath: NursingBasePath): boolean {
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

export function ConfirmNursingPayment({ basePath }: { basePath: NursingBasePath }) {
  const router = useRouter();
  const app = isAppNursing(basePath);
  const [pending, setPending] = useState<PendingNursingPayment | null>(null);
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    PasteurStorage.initPatientDomainIfNeeded();
    const data = PasteurStorage.getPendingPayment() as PendingPayment | null;
    if (!data || data.kind !== "nursing") {
      router.replace(app ? ROUTES.app.nursing : ROUTES.web.nursing);
      return;
    }
    setPending(data as PendingNursingPayment);
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

  if (!ready || !pending) {
    return (
      <div className={app ? "p-4 text-sm text-slate-500" : "mx-auto max-w-md px-4 py-10 text-sm text-slate-500"}>
        در حال بارگذاری...
      </div>
    );
  }

  const amount = Number(pending.amountToman || pending.amount || 0);
  const body = (
    <>
      {!app ? (
        <>
          <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">تأیید و پرداخت پرستاری</h1>
          <p className="mb-8 text-center text-slate-600">مبلغ بر اساس تعرفه خدمت انتخاب‌شده است</p>
        </>
      ) : null}

      <Card className="mb-6 space-y-3 p-6 text-sm" hover={false}>
        <h2 className="mb-1 text-lg font-bold">خلاصه درخواست</h2>
        <SummaryRow label="مراجع:" value={String(pending.patientName || "—")} />
        <SummaryRow label="موبایل:" value={String(pending.patientPhone || "—")} />
        <SummaryRow label="دسته:" value={String(pending.serviceTitle || "پرستاری")} />
        <SummaryRow label="خدمت / تعرفه:" value={String(pending.itemTitle || "—")} />
        {pending.unit ? <SummaryRow label="واحد:" value={String(pending.unit)} /> : null}
        {pending.description ? (
          <SummaryRow label="توضیحات:" value={String(pending.description)} />
        ) : null}
        <SummaryRow
          label={String(pending.paymentLabel || "مبلغ تعرفه")}
          value={formatPrice(amount)}
          last
        />
      </Card>

      {note ? <p className="mb-3 text-sm font-bold text-red-600">{note}</p> : null}

      <Button onClick={onPay} disabled={paying} className="mb-3 w-full py-3 text-base">
        {paying ? "در حال اتصال به درگاه..." : "پرداخت و انتقال به درگاه"}
      </Button>
      <Button
        href={app ? ROUTES.app.nursing : ROUTES.web.nursing}
        variant="ghost"
        className="w-full"
      >
        بازگشت
      </Button>
    </>
  );

  if (app) return <div className="p-4">{body}</div>;
  return <div className="mx-auto max-w-md px-4 py-10 sm:px-6">{body}</div>;
}

export function NursingPaymentSuccess({ basePath }: { basePath: NursingBasePath }) {
  const app = isAppNursing(basePath);
  const [ready, setReady] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    const intentId = getPaymentIntentIdFromSearch(window.location.search);
    if (intentId) {
      void fetchZibalPaymentResultApi(intentId)
        .then((result) => {
          applyPaymentResultToStorage(result.payment as Record<string, unknown>);
          setAmount(Number(result.payment.amountToman || result.payment.amount || 0));
        })
        .catch(() => {
          const last = PasteurStorage.getLastPayment();
          if (last?.kind === "nursing") {
            setAmount(Number(last.amountToman || last.amount || 0));
          }
        })
        .finally(() => setReady(true));
      return;
    }
    const last = PasteurStorage.getLastPayment();
    if (last?.kind === "nursing") {
      setAmount(Number(last.amountToman || last.amount || 0));
    }
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
      <h1 className="mt-3 text-xl font-bold text-slate-900">پرداخت خدمت پرستاری ثبت شد</h1>
      <p className="mt-2 text-sm text-slate-600">
        درخواست بر اساس تعرفه انتخاب‌شده ثبت شد. کارشناسان برای هماهنگی اعزام تماس می‌گیرند.
      </p>
      {amount != null && amount > 0 ? (
        <p className="mt-4 text-lg font-extrabold text-teal-700">{formatPrice(amount)}</p>
      ) : null}
      <Button href={app ? ROUTES.app.nursing : ROUTES.web.nursing} className="mt-6 w-full">
        بازگشت به پرستاری
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

export function NursingPaymentFailed({ basePath }: { basePath: NursingBasePath }) {
  const app = isAppNursing(basePath);
  const body = (
    <Card hover={false} className="p-8 text-center">
      <p className="text-5xl">❌</p>
      <h1 className="mt-3 text-xl font-bold text-slate-900">پرداخت ناموفق بود</h1>
      <p className="mt-2 text-sm text-slate-600">در صورت کسر وجه، طی ۷۲ ساعت به حساب بازمی‌گردد.</p>
      <Button href={app ? ROUTES.app.nursingConfirm : ROUTES.web.nursingConfirm} className="mt-6 w-full">
        تلاش مجدد
      </Button>
      <Button href={app ? ROUTES.app.nursing : ROUTES.web.nursing} variant="ghost" className="mt-3 w-full">
        بازگشت
      </Button>
    </Card>
  );
  if (app) return body;
  return <div className="mx-auto max-w-md px-4 py-10 sm:px-6">{body}</div>;
}
