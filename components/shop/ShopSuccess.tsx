"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  applyPaymentResultToStorage,
  fetchZibalPaymentResultApi,
  getPaymentIntentIdFromSearch,
} from "@/lib/payment/zibal-client";
import { ShopCart } from "@/lib/shop";
import { PasteurStorage } from "@/lib/storage";
import { useEffect, useState } from "react";
import { shopRoutes, type ShopVariant } from "./types";

type LastPayment = Record<string, unknown> | null;

export function ShopSuccess({ variant = "web" }: { variant?: ShopVariant }) {
  const routes = shopRoutes(variant);
  const [total, setTotal] = useState<number | null>(null);
  const [paid, setPaid] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const intentId = getPaymentIntentIdFromSearch(window.location.search);
    if (intentId) {
      void fetchZibalPaymentResultApi(intentId)
        .then((result) => {
          applyPaymentResultToStorage(result.payment as Record<string, unknown>);
          const amount = Number(result.payment.amountToman || result.payment.amount || 0);
          if (amount > 0) setTotal(amount);
          setPaid(result.status === "paid");
        })
        .catch(() => {
          const last = PasteurStorage.getLastPayment();
          if (last?.status === "paid") {
            setPaid(true);
            setTotal(Number(last.amountToman || last.amount || ShopCart.getLastOrderTotal() || 0));
          } else {
            setTotal(ShopCart.getLastOrderTotal());
          }
        })
        .finally(() => setReady(true));
      return;
    }
    setTotal(ShopCart.getLastOrderTotal());
    const last = PasteurStorage.getLastPayment();
    setPaid(last?.kind === "shop-order" && last?.status === "paid");
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className={variant === "app" ? "p-4 text-center text-sm text-slate-500" : "mx-auto max-w-md px-4 py-10 text-center text-sm text-slate-500"}>
        در حال بارگذاری...
      </div>
    );
  }

  const body = (
    <Card hover={false} className="p-8 text-center">
      <p className="text-5xl">✅</p>
      <h1 className="mt-3 text-xl font-bold text-slate-900">
        {paid ? "پرداخت و سفارش با موفقیت ثبت شد" : "سفارش ثبت شد"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {paid
          ? "پرداخت شما تأیید شد. سفارش در وضعیت تأیید‌شده ثبت شده و برای ارسال پیگیری می‌شود."
          : "کارشناس فروش به‌زودی با شما تماس می‌گیرد."}
      </p>
      {total != null && total > 0 ? (
        <p className="mt-4 text-lg font-extrabold text-teal-700">
          {total.toLocaleString("fa-IR")} تومان
        </p>
      ) : null}
      <Button href={routes.catalog} className="mt-6 w-full">
        ادامه خرید
      </Button>
      <Button href={routes.root} variant="ghost" className="mt-3 w-full">
        بازگشت به خانه
      </Button>
    </Card>
  );

  if (variant === "app") return body;

  return <div className="mx-auto max-w-md px-4 py-10 sm:px-6">{body}</div>;
}
