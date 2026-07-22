"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PaymentFlow, type PendingPayment } from "@/lib/payment";
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

function PaymentSummary({ pending }: { pending: PendingPayment }) {
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
          label="بیعانه رزرو نوبت:"
          value={formatPrice(Number(pending.amount) || 0)}
          last
        />
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800">
          این مبلغ بیعانه رزرو است و در صورت لغو نوبت قابل استرداد نیست. هزینه کامل
          ویزیت یا درمان جداگانه در مطب هماهنگ می‌شود.
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
            label="تخفیف مدت‌دار:"
            value={`${Number(pending.discountPercent).toLocaleString("fa-IR")}٪`}
          />
        ) : null}
        {pending.referralCode ? (
          <SummaryRow label="کد معرف:" value={String(pending.referralCode)} />
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
      <SummaryRow
        label="مبلغ:"
        value={formatPrice(Number(pending.amount) || 0)}
        last
      />
    </Card>
  );
}

export function ConfirmPayment({ basePath }: { basePath: DentalBasePath }) {
  const router = useRouter();
  const app = isAppDental(basePath);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const data = PasteurStorage.getPendingPayment() as PendingPayment | null;
    if (!data) {
      router.replace(app ? "/app/dental/general" : "/dental/general");
      return;
    }
    setPending(data);
    setReady(true);
  }, [app, router]);

  const onPay = () => {
    if (!pending || paying) return;
    setPaying(true);
    window.setTimeout(() => {
      PaymentFlow.completePayment(pending);
      router.push(PaymentFlow.defaultSuccessHref(pending));
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

      <PaymentSummary pending={pending} />

      {!app ? (
        <Card className="mb-6 border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-800" hover={false}>
          🔒 اتصال امن به درگاه پرداخت — این نسخه نمایشی است. برای ارائه فرانت، پرداخت موفق و
          ناموفق هر دو قابل شبیه‌سازی هستند.
        </Card>
      ) : null}

      <Button onClick={onPay} disabled={paying} className="mb-3 w-full py-3 text-base">
        {paying ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            در حال اتصال به درگاه...
          </>
        ) : app ? (
          "پرداخت موفق (نمایشی)"
        ) : (
          "شبیه‌سازی پرداخت موفق"
        )}
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
