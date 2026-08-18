"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  applyPaymentResultToStorage,
  fetchZibalPaymentResultApi,
  getPaymentIntentIdFromSearch,
} from "@/lib/payment/zibal-client";
import { PasteurStorage } from "@/lib/storage";
import { useEffect, useState } from "react";
import { shopRoutes, type ShopVariant } from "./types";

export function ShopFailed({ variant = "web" }: { variant?: ShopVariant }) {
  const routes = shopRoutes(variant);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const intentId = getPaymentIntentIdFromSearch(window.location.search);
    if (intentId) {
      void fetchZibalPaymentResultApi(intentId)
        .then((result) => {
          applyPaymentResultToStorage(result.payment as Record<string, unknown>);
        })
        .catch(() => PasteurStorage.getLastPayment())
        .finally(() => setReady(true));
      return;
    }
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
      <p className="text-5xl">❌</p>
      <h1 className="mt-3 text-xl font-bold text-slate-900">پرداخت ناموفق بود</h1>
      <p className="mt-2 text-sm text-slate-600">
        تراکنش انجام نشد. سبد خرید شما حفظ شده — می‌توانید دوباره تلاش کنید.
      </p>
      <Button href={routes.cart} className="mt-6 w-full">
        بازگشت به سبد
      </Button>
      <Button href={routes.catalog} variant="ghost" className="mt-3 w-full">
        مشاهده محصولات
      </Button>
    </Card>
  );

  if (variant === "app") return body;

  return <div className="mx-auto max-w-md px-4 py-10 sm:px-6">{body}</div>;
}
