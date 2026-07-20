"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShopCart } from "@/lib/shop";
import { useEffect, useState } from "react";
import { shopRoutes, type ShopVariant } from "./types";

export function ShopSuccess({ variant = "web" }: { variant?: ShopVariant }) {
  const routes = shopRoutes(variant);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    setTotal(ShopCart.getLastOrderTotal());
  }, []);

  const body = (
    <Card hover={false} className="p-8 text-center">
      <p className="text-5xl">✅</p>
      <h1 className="mt-3 text-xl font-bold text-slate-900">سفارش ثبت شد</h1>
      <p className="mt-2 text-sm text-slate-600">کارشناس فروش به‌زودی با شما تماس می‌گیرد.</p>
      {total != null ? (
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
