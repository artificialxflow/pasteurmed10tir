"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  applyPaymentResultToStorage,
  fetchZibalPaymentResultApi,
  getPaymentIntentIdFromSearch,
} from "@/lib/payment/zibal-client";
import { requiresOnlinePayment } from "@/lib/payment/free-reservation";
import { ROUTES } from "@/lib/routes";
import { PasteurStorage } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

type LastPayment = Record<string, unknown> | null;

export function PaymentSuccess({ basePath }: { basePath: DentalBasePath }) {
  const app = isAppDental(basePath);
  const [payment, setPayment] = useState<LastPayment>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const intentId = getPaymentIntentIdFromSearch(window.location.search);
    if (intentId) {
      void fetchZibalPaymentResultApi(intentId)
        .then((result) => {
          applyPaymentResultToStorage(result.payment as Record<string, unknown>);
          setPayment(result.payment as LastPayment);
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

  const kind = payment?.kind;
  const planId = payment?.planId;
  const showWalletLink = kind === "membership" || planId === "shop-vip";
  const walletHref = app ? ROUTES.app.wallet : ROUTES.web.wallet;

  let title = "پرداخت با موفقیت انجام شد!";
  let desc = "اطلاعات شما ثبت شد و کارشناسان پاستور پلاس پیگیری می‌کنند.";
  let badge = "پرداخت با موفقیت ثبت شد.";
  let primaryLabel = "رزرو جدید";
  let primaryHref = `${basePath}/general`;
  let showReminder = false;

  if (kind === "booking") {
    const amt = Number(payment?.amount) || 0;
    const isFree = !requiresOnlinePayment(amt);
    title = app ? "رزرو ثبت شد" : "رزرو با موفقیت ثبت شد!";
    if (isFree) {
      desc = app
        ? "نوبت شما بدون پرداخت بیعانه ثبت شد. هزینه ویزیت یا درمان در مطب هماهنگ می‌شود."
        : "رزرو شما بدون پرداخت بیعانه ثبت شد. هزینه باقی‌مانده ویزیت یا درمان در مطب هماهنگ می‌شود.";
      badge = app ? "رزرو بدون پرداخت ثبت شد. +۵۰ امتیاز باشگاه" : "رزرو بدون پرداخت ثبت شد. +۵۰ امتیاز به باشگاه مشتریان شما اضافه شد 🎁";
    } else {
      desc = app
        ? "بیعانه رزرو پرداخت شد و از صورتحساب نهایی کسر می‌شود. هزینه باقی‌مانده در مطب هماهنگ می‌شود."
        : "بیعانه رزرو شما پرداخت شد و از مبلغ صورتحسابتان کسر خواهد شد. هزینه باقی‌مانده ویزیت یا درمان در مطب هماهنگ می‌شود.";
      badge = app
        ? `بیعانه ${formatPrice(amt)} ثبت شد. +۵۰ امتیاز باشگاه`
        : `بیعانه ${formatPrice(amt)} ثبت شد. +۵۰ امتیاز به باشگاه مشتریان شما اضافه شد 🎁`;
    }
    primaryLabel = "رزرو جدید";
    primaryHref = `${basePath}/general`;
    showReminder = true;
  } else if (planId === "shop-vip") {
    title = "VIP تجهیزات فعال شد!";
    desc =
      "اکنون می‌توانید از تخفیف VIP و درخواست تسهیلات تجهیزات استفاده کنید.";
    badge = `عضویت ${String(payment?.planName || "")} برای ${String(payment?.patientName || "کاربر")} ثبت شد.`;
    primaryLabel = "ورود به فروشگاه";
    primaryHref = app
      ? `${ROUTES.app.shopCatalog}?vip=paid`
      : `${ROUTES.web.shopCatalog}?vip=paid`;
  } else if (kind === "membership") {
    title = app ? "عضویت فعال شد" : "عضویت با موفقیت ثبت شد!";
    desc = app
      ? `${String(payment?.planName || "")} — ${String(payment?.patientName || "")}`
      : "فرم و پرداخت عضویت ثبت شد و در پنل ادمین قابل مشاهده است.";
    badge = `${String(payment?.planName || "طرح عضویت")} با مبلغ ${formatPrice(Number(payment?.amount) || 0)} ثبت شد.`;
    primaryLabel = app ? "بازگشت به دندانپزشکی" : "مشاهده عضویت‌ها";
    primaryHref = app ? basePath : `${basePath}/membership`;
  }

  if (app) {
    return (
      <div className="space-y-4 text-center">
        <p className="m-0 text-5xl">✅</p>
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{desc}</p>
        <Button href={primaryHref} className="w-full">
          {primaryLabel}
        </Button>
        {showWalletLink ? (
          <Button href={walletHref} variant="outline" className="w-full">
            مشاهده کیف اعتبار
          </Button>
        ) : null}
        {showReminder ? (
          <Link
            href={ROUTES.app.reminders}
            className="block text-sm font-bold text-teal-700 underline"
          >
            فعال‌سازی یادآور
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-400 bg-green-100 text-4xl">
          ✅
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mb-4 text-slate-600">{desc}</p>
        <p className="mb-6 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
          {badge}
        </p>

        {showReminder ? (
          <Card className="mb-6 border-blue-200 bg-blue-50 p-5 text-right" hover={false}>
            <p className="mb-2 font-bold text-blue-900">🔔 یادآور هوشمند</p>
            <p className="mb-3 text-sm text-slate-600">
              فراموش نکنید! یادآور نوبت خود را فعال کنید.
            </p>
            <Button href={ROUTES.web.reminders} variant="accent" className="w-full text-sm">
              فعال‌سازی یادآور
            </Button>
          </Card>
        ) : null}

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href={primaryHref}>{primaryLabel}</Button>
          {showWalletLink ? (
            <Button href={walletHref} variant="outline">
              مشاهده کیف اعتبار
            </Button>
          ) : null}
          <Button href={ROUTES.web.club} variant="outline" className="border-amber-300 text-amber-800">
            باشگاه مشتریان
          </Button>
          <Button href={ROUTES.web.home} variant="outline">
            صفحه اصلی
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PaymentFailed({ basePath }: { basePath: DentalBasePath }) {
  const app = isAppDental(basePath);
  const [payment, setPayment] = useState<LastPayment>(null);

  useEffect(() => {
    const intentId = getPaymentIntentIdFromSearch(window.location.search);
    if (intentId) {
      void fetchZibalPaymentResultApi(intentId)
        .then((result) => {
          applyPaymentResultToStorage(result.payment as Record<string, unknown>);
          setPayment(result.payment as LastPayment);
        })
        .catch(() => setPayment(PasteurStorage.getLastPayment()));
      return;
    }
    setPayment(PasteurStorage.getLastPayment());
  }, []);

  let desc =
    "متأسفانه تراکنش انجام نشد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.";
  let retryHref = `${basePath}/confirm`;
  let retryLabel = "تلاش مجدد";

  if (payment?.kind === "membership") {
    desc =
      "پرداخت عضویت انجام نشد. می‌توانید دوباره تلاش کنید یا به صفحه عضویت برگردید.";
    retryHref = `${basePath}/membership`;
    retryLabel = "بازگشت به عضویت";
  } else if (payment?.kind === "booking") {
    desc =
      "پرداخت رزرو انجام نشد. می‌توانید دوباره به مرحله تأیید برگردید یا رزرو جدید ثبت کنید.";
  }

  if (app) {
    return (
      <div className="space-y-4 text-center">
        <p className="m-0 text-5xl">❌</p>
        <h2 className="text-lg font-extrabold text-slate-900">پرداخت ناموفق</h2>
        <p className="text-sm text-slate-500">لطفاً دوباره تلاش کنید</p>
        <Button href={`${basePath}/confirm`} className="w-full">
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
        <p className="mb-8 text-slate-600">{desc}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button href={retryHref}>{retryLabel}</Button>
          <Button href={ROUTES.web.home} variant="outline">
            صفحه اصلی
          </Button>
        </div>
      </div>
    </div>
  );
}
